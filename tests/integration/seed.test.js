'use strict';

// Integration test of resources/scripts/SeedDatabase.js (seed, without the connection),
// against the in-memory MongoDB of the run (tests/fixtures/memoryDb.js).

const mongoose = require('mongoose');
const db = require('#root/tests/fixtures/memoryDb.js');
db.registerModels();
const { seed } = require('#root/resources/scripts/SeedDatabase.js');
const migrations = require('#root/database/migrations/index.js');

const EXPECTED = {
	boostertypes: 5,
	dbversions: 1,
	netracellrewardsources: 2,
	netracellrewardtypes: 6,
	rewardsources: 2,
	rewardtypes: 10,
	rivenconditions: 56,
	rivensources: 12,
	riventypes: 8,
	temporalrewardsources: 1,
	temporalrewardtypes: 12,
};

describe('seed()', () => {
	beforeAll(() => db.connect(__filename));
	afterEach(() => db.clear());
	afterAll(() => db.disconnect());

	// the seed is at schema version 4 : the migrations added later run at the next launch of the application
	it('fills an empty database with the default data, at schema version 4', async () => {
		expect(await migrations.isEmpty()).toBe(true);
		const result = await seed(mongoose.connection.db);
		expect(result).toEqual({ inserted: EXPECTED, skipped: [] });
		expect(await migrations.isEmpty()).toBe(false);
		expect(await migrations.currentVersion()).toBe(4);
		expect((await mongoose.model('RewardType').findOne({ name: 'Riven Mod' })).more_info).toBeDefined();
	});

	it('keeps no reference to a user', async () => {
		await seed(mongoose.connection.db);
		for (const name of Object.keys(EXPECTED)) {
			const count = await mongoose.connection.db.collection(name)
				.countDocuments({ $or: [{ createdBy: { $exists: true } }, { modifiedBy: { $exists: true } }] });
			expect(count).toBe(0);
		}
	});

	it('inserts nothing the second time', async () => {
		await seed(mongoose.connection.db);
		const again = await seed(mongoose.connection.db);
		expect(again).toEqual({ inserted: {}, skipped: Object.keys(EXPECTED) });
		expect(await mongoose.model('RivenCondition').countDocuments()).toBe(56);
	});

	it('skips a collection that is not empty, and leaves it untouched', async () => {
		await mongoose.model('RewardSource').create({ name: 'My source' });
		const result = await seed(mongoose.connection.db);
		expect(result.skipped).toEqual(['rewardsources']);
		expect(result.inserted.rewardtypes).toBe(10);
		const sources = await mongoose.model('RewardSource').find();
		expect(sources.map(s => s.name)).toEqual(['My source']);
	});
});
