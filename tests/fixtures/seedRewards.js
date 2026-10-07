'use strict';

// Adds generated rewards to a database, to test the pagination performance with a large amount of data.
//
//   node tests/fixtures/seedRewards.js [count] [--seed=42]   adds <count> rewards (default 10000)
//   node tests/fixtures/seedRewards.js --remove              removes every generated reward
//
// Database : MONGO_URI, default mongodb://127.0.0.1/WarframeStatsDB (the app outside Docker).
// No new reference is created : each generated reward copies the type, source, booster and riven type
// of a randomly picked existing reward (same distribution, same booster/riven rules), never its riven.
// The generated rewards are marked by a "createdBy" that is not a real user (SEED_USER).

const mongoose = require('mongoose');

require('../../api/models/rivenTypeModel');
require('../../api/models/boosterTypeModel');
require('../../api/models/rewardTypeModel');
require('../../api/models/rewardSourceModel');
require('../../api/models/rewardModel');

const Reward = mongoose.model('Reward');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1/WarframeStatsDB';
const SEED_USER = new mongoose.Types.ObjectId('5eed00000000000000000000');
const BATCH = 1000;
const DAY = 24 * 60 * 60 * 1000;

const args = process.argv.slice(2);
const remove = args.includes('--remove');
const count = Number.parseInt(args.find(a => /^\d+$/.test(a)) || '10000', 10);
const seedArg = args.find(a => a.startsWith('--seed='));
const seed = seedArg ? Number.parseInt(seedArg.slice(7), 10) : 42;

// mulberry32 : a small seeded PRNG, the same dataset on every run
function mulberry32(a) {
	return function() {
		a |= 0; a = a + 0x6D2B79F5 | 0;
		let t = Math.imul(a ^ a >>> 15, 1 | a);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}

async function seedRewards(random) {
	const models = await Reward.find({ createdBy: { $ne: SEED_USER } })
		.select('type source booster rivenType date').lean().exec();
	if (models.length === 0) throw new Error('No existing reward to copy from.');
	const first = Math.floor(Math.min(...models.map(m => m.date.getTime())) / DAY);
	const last = Math.floor(Math.max(...models.map(m => m.date.getTime())) / DAY);

	for (let done = 0; done < count; done += BATCH) {
		const batch = [];
		for (let i = 0; i < Math.min(BATCH, count - done); i++) {
			const model = models[Math.floor(random() * models.length)];
			const date = new Date((first + Math.floor(random() * (last - first + 1))) * DAY + DAY / 2);	// 12:00 UTC
			const reward = { type: model.type, source: model.source, date: date,
				Created_date: new Date(date.getTime() + Math.floor(random() * 10) * 60 * 60 * 1000),
				createdBy: SEED_USER };
			if (model.booster) reward.booster = model.booster;
			if (model.rivenType) reward.rivenType = model.rivenType;
			batch.push(reward);
		}
		await Reward.insertMany(batch);
		process.stdout.write(`\r${done + batch.length} / ${count}`);
	}
	process.stdout.write('\n');
}

async function main() {
	await mongoose.connect(MONGO_URI, { family: 4 });
	console.log(`Database ${MONGO_URI} : ${await Reward.countDocuments()} rewards`);
	if (remove) {
		const ret = await Reward.deleteMany({ createdBy: SEED_USER });
		console.log(`Removed ${ret.deletedCount} generated rewards`);
	} else {
		await seedRewards(mulberry32(seed));
	}
	console.log(`Database ${MONGO_URI} : ${await Reward.countDocuments()} rewards`);
}

main()
	.catch(err => { console.error(err); process.exitCode = 1; })
	.finally(() => mongoose.disconnect());
