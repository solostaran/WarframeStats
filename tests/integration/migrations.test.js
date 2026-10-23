'use strict';

// Integration test of the data migrations (database/migrations), run at launch by app.js,
// against an in-memory MongoDB (no external database needed).

const mongoose = require('mongoose');
const db = require('#root/tests/fixtures/memoryDb.js');

// Mongoose Schemas, before the migrations (they get their models when required)
const { netracellRewardTypes, netracellRewardSources } = require('#root/api/models/netracellModel.js');
const { temporalRewardTypes, temporalRewardSources } = require('#root/api/models/temporalModel.js');
require('#root/database/dbVersionModel.js');
const migrations = require('#root/database/migrations/index.js');

const Netracell = mongoose.model('NetracellReward');
const NetracellRewardType = mongoose.model('NetracellRewardType');
const NetracellRewardSource = mongoose.model('NetracellRewardSource');
const TemporalRewardType = mongoose.model('TemporalRewardType');
const TemporalRewardSource = mongoose.model('TemporalRewardSource');
const DbVersion = mongoose.model('DbVersion');

describe('data migrations', () => {
	beforeAll(async () => {
		await db.connect(__filename);
	});

	afterAll(async () => {
		await db.disconnect();
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

		it('is not empty', async () => {
			expect(await migrations.isEmpty()).toBe(false);
		});

		it('has no version document, so it is at version 1', async () => {
			expect(await migrations.currentVersion()).toBe(1);
		});

		it('migrates to the latest version', async () => {
			expect(await migrations.migrate()).toBe(migrations.LATEST_VERSION);
			expect(migrations.LATEST_VERSION).toBe(4);
			const doc = await DbVersion.findById('schema').lean();
			expect(doc.version).toBe(4);
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

		it('makes the reward and tauforged of every netracell reward its single loot', async () => {
			const docs = await Netracell.collection.find({}).sort({ date: -1 }).toArray();
			expect(docs.map(doc => doc.loots)).toEqual([
				[{ reward: expect.objectContaining({ type: netracellRewardTypes[0] }), tauforged: true }],
				[{ reward: expect.objectContaining({ type: netracellRewardTypes[4] }) }]
			]);
			docs.forEach(doc => {
				expect(doc).not.toHaveProperty('reward');
				expect(doc).not.toHaveProperty('tauforged');
			});
		});

		it('seeds the temporal reward sources and types', async () => {
			const sources = await TemporalRewardSource.find({}).lean();
			expect(sources.map(s => s.type)).toEqual(temporalRewardSources);
			const types = await TemporalRewardType.find({}).lean();
			expect(types.map(t => t.type).sort()).toEqual([...temporalRewardTypes].sort());
		});

		it('does nothing when run again', async () => {
			const before = await Netracell.collection.find({}).sort({ date: -1 }).toArray();
			expect(await migrations.migrate()).toBe(4);
			expect(await NetracellRewardSource.countDocuments({})).toBe(netracellRewardSources.length);
			expect(await TemporalRewardSource.countDocuments({})).toBe(temporalRewardSources.length);
			expect(await TemporalRewardType.countDocuments({})).toBe(temporalRewardTypes.length);
			expect(await Netracell.countDocuments({ 'source.type': 'Netracell' })).toBe(2);
			expect(await Netracell.collection.find({}).sort({ date: -1 }).toArray()).toEqual(before);
		});
	});

	describe('from a version 2 database', () => {
		beforeAll(async () => {
			await mongoose.connection.dropDatabase();
			const types = await NetracellRewardType.insertMany(netracellRewardTypes.map(type => ({ type })));
			const sources = await NetracellRewardSource.insertMany(netracellRewardSources.map(type => ({ type })));
			await DbVersion.create({ _id: 'schema', version: 2 });
			// version 2 netracell rewards : a source, a single reward
			await Netracell.collection.insertMany([
				{ source: { _id: sources[1]._id, type: sources[1].type },
					reward: { _id: types[2]._id, type: types[2].type }, tauforged: true, date: new Date('2024-12-16') }
			]);
		});

		it('only runs the migrations 3 and 4', async () => {
			expect(await migrations.currentVersion()).toBe(2);
			expect(await migrations.migrate()).toBe(4);
			expect(await NetracellRewardSource.countDocuments({})).toBe(netracellRewardSources.length);
			const doc = await Netracell.collection.findOne({});
			expect(doc.source.type).toBe('Deep Archimedea');
			expect(doc.loots).toEqual([{ reward: expect.objectContaining({ type: netracellRewardTypes[2] }), tauforged: true }]);
		});
	});

	describe('from a version 3 database, partly seeded by /temporal/setSources and /temporal/setTypes', () => {
		beforeAll(async () => {
			await mongoose.connection.dropDatabase();
			await DbVersion.create({ _id: 'schema', version: 3 });
			await TemporalRewardSource.insertMany(temporalRewardSources.map(type => ({ type })));
			await TemporalRewardType.insertMany(temporalRewardTypes.slice(0, 2).map(type => ({ type })));
		});

		it('only runs the migration 4, without duplicate', async () => {
			const [source] = await TemporalRewardSource.find({}).lean();
			expect(await migrations.migrate()).toBe(4);
			const sources = await TemporalRewardSource.find({}).lean();
			expect(sources).toEqual([source]);
			const types = await TemporalRewardType.find({}).lean();
			expect(types.map(t => t.type).sort()).toEqual([...temporalRewardTypes].sort());
		});
	});

	describe('from an empty database', () => {
		beforeAll(async () => {
			await mongoose.connection.dropDatabase();
			// empty collections, as the ones created by the indexes at launch
			await Netracell.createCollection();
			await NetracellRewardType.createCollection();
		});

		it('is empty', async () => {
			expect(await migrations.isEmpty()).toBe(true);
		});

		it('is not migrated and stays at version 1', async () => {
			expect(await migrations.migrate()).toBe(1);
			expect(await DbVersion.findById('schema').lean()).toBeNull();
			expect(await NetracellRewardSource.countDocuments({})).toBe(0);
			expect(await TemporalRewardSource.countDocuments({})).toBe(0);
			expect(await TemporalRewardType.countDocuments({})).toBe(0);
		});

		it('is no longer empty with a document', async () => {
			await NetracellRewardType.create({ type: netracellRewardTypes[0] });
			expect(await migrations.isEmpty()).toBe(false);
		});
	});

	it('rejects a database newer than the application', async () => {
		await mongoose.connection.dropDatabase();
		await DbVersion.create({ _id: 'schema', version: migrations.LATEST_VERSION + 1 });
		await expect(migrations.migrate()).rejects.toThrow(/newer than the application/);
	});
});
