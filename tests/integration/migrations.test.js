'use strict';

// Integration test of the data migrations (api/migrations), run at launch by app.js,
// against an in-memory MongoDB (no external database needed).

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mongoose Schemas, before the migrations (they get their models when required)
const { netracellRewardTypes, netracellRewardSources } = require('../../api/models/netracellModel');
require('../../api/models/dbVersionModel');
const migrations = require('../../api/migrations');

const Netracell = mongoose.model('NetracellReward');
const NetracellRewardType = mongoose.model('NetracellRewardType');
const NetracellRewardSource = mongoose.model('NetracellRewardSource');
const DbVersion = mongoose.model('DbVersion');

describe('data migrations', () => {
	let mongoServer;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	describe('from a version 1 database', () => {
		beforeAll(async () => {
			await mongoose.connection.dropDatabase();
			const types = await NetracellRewardType.insertMany(netracellRewardTypes.map(type => ({ type })));
			// version 1 netracell rewards : no source
			await Netracell.collection.insertMany([
				{ reward: { _id: types[0]._id, type: types[0].type }, tauforged: true, date: new Date('2024-12-16') },
				{ reward: { _id: types[4]._id, type: types[4].type }, date: new Date('2024-12-10') }
			]);
		});

		it('has no version document, so it is at version 1', async () => {
			expect(await migrations.currentVersion()).toBe(1);
		});

		it('migrates to the latest version', async () => {
			expect(await migrations.migrate()).toBe(migrations.LATEST_VERSION);
			expect(migrations.LATEST_VERSION).toBe(2);
			const doc = await DbVersion.findById('schema').lean();
			expect(doc.version).toBe(2);
			expect(doc.migratedAt).toBeInstanceOf(Date);
		});

		it('seeds the netracell reward sources', async () => {
			const sources = await NetracellRewardSource.find({}).lean();
			expect(sources.map(s => s.type).sort()).toEqual([...netracellRewardSources].sort());
		});

		it('gives the Netracell source to every netracell reward', async () => {
			const source = await NetracellRewardSource.findOne({ type: 'Netracell' }).lean();
			const docs = await Netracell.find({}).lean();
			expect(docs).toHaveLength(2);
			docs.forEach(doc => {
				expect(doc.source.type).toBe('Netracell');
				expect(String(doc.source._id)).toBe(String(source._id));
			});
		});

		it('does nothing when run again', async () => {
			expect(await migrations.migrate()).toBe(2);
			expect(await NetracellRewardSource.countDocuments({})).toBe(netracellRewardSources.length);
			expect(await Netracell.countDocuments({ 'source.type': 'Netracell' })).toBe(2);
		});
	});

	it('rejects a database newer than the application', async () => {
		await mongoose.connection.dropDatabase();
		await DbVersion.create({ _id: 'schema', version: migrations.LATEST_VERSION + 1 });
		await expect(migrations.migrate()).rejects.toThrow(/newer than the application/);
	});
});
