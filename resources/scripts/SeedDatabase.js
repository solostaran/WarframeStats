'use strict';

// Inserts the default data of a new database : the reward, riven, booster, netracell and temporal types and sources,
// the riven conditions and the schema version (resources/seed/WarframeStatsDB, one Extended JSON file per collection).
// Usage : node resources/scripts/SeedDatabase.js (see resources/compose/seed_warstats_host_script.sh)
// MONGO_URI : the database (default : the local WarframeStatsDB).
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const { EJSON } = mongoose.mongo.BSON;
const SEED_DIR = path.join(__dirname, '..', 'seed', 'WarframeStatsDB');

// A collection that already has documents is skipped : a second run inserts nothing, existing data is never replaced
async function seed(db) {
	const result = { inserted: {}, skipped: [] };
	for (const file of fs.readdirSync(SEED_DIR).filter(f => f.endsWith('.json')).sort()) {
		const name = path.basename(file, '.json');
		const collection = db.collection(name);
		if (await collection.countDocuments({}, { limit: 1 }) > 0) {
			result.skipped.push(name);
			continue;
		}
		const docs = EJSON.parse(fs.readFileSync(path.join(SEED_DIR, file), 'utf8'), { relaxed: true });
		await collection.insertMany(docs);
		result.inserted[name] = docs.length;
	}
	return result;
}

async function main() {
	await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1/WarframeStatsDB', { family: 4 });
	try {
		const { inserted, skipped } = await seed(mongoose.connection.db);
		for (const [name, count] of Object.entries(inserted)) console.log('Inserted ' + count + ' documents into ' + name);
		if (skipped.length > 0) console.log('Skipped (not empty) : ' + skipped.join(', '));
	} finally {
		await mongoose.disconnect();
	}
}

if (require.main === module) {
	main().catch(err => {
		console.error(err.message);
		process.exitCode = 1;
	});
}

module.exports = { seed };
