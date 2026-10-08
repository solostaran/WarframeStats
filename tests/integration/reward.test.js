'use strict';

// Integration test of the server-side pagination of the rewards (GET /reward/paged) :
// router + business process + mongoose models, against an in-memory MongoDB.

const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mongoose Schemas (same order as app.js), before the router (the business processes get their models when required)
require('../../api/models/rivenTypeModel');
require('../../api/models/rivenSourceModel');
require('../../api/models/rivenConditionModel');
require('../../api/models/rivenModel');
require('../../api/models/boosterTypeModel');
require('../../api/models/rewardTypeModel');
require('../../api/models/rewardSourceModel');
require('../../api/models/rewardModel');
require('../../api/models/Users');

const Reward = mongoose.model('Reward');

function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(cookieParser());
	app.use('/reward', require('../../routes/rewardRoutes'));
	return app;
}

describe('GET /reward/paged', () => {
	let mongoServer;
	let app;
	let ids;	// ids of the seeded references

	const paged = (query = {}) => request(app).get('/reward/paged').query(query);
	const filter = (f, query = {}) => paged({ ...query, filter: JSON.stringify(f) });
	const days = res => res.body.rows.map(r => r.date.substring(0, 10));

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());
		app = buildApp();

		const [sculpture, rivenMod] = await mongoose.model('RewardType').create([{ name: 'Anasa Ayatan Sculpture' }, { name: 'Riven Mod' }]);
		const [sortie, archon] = await mongoose.model('RewardSource').create([{ name: 'Sortie' }, { name: "Archon's hunt" }]);
		const booster = await mongoose.model('BoosterType').create({ name: 'Affinity Booster', description: 'x2 affinity' });
		const rifle = await mongoose.model('RivenType').create({ name: 'rifle' });
		ids = { sculpture: sculpture.id, rivenMod: rivenMod.id, sortie: sortie.id, archon: archon.id, booster: booster.id, rifle: rifle.id };

		await Reward.create([
			{ type: sculpture, source: sortie, date: '2025-01-01T12:00:00Z' },
			{ type: rivenMod, source: sortie, rivenType: rifle, date: '2025-01-15T12:00:00Z' },
			{ type: sculpture, source: archon, booster: booster, date: '2025-02-01T12:00:00Z' },
			{ type: rivenMod, source: archon, rivenType: rifle, date: '2025-02-15T12:00:00Z' },
			{ type: sculpture, source: sortie, date: '2025-03-01T12:00:00Z' },
		]);
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
	});

	it('returns the first page, newest first, with the populated references', async () => {
		const res = await paged().expect(200);
		expect(res.body.total).toBe(5);
		expect(days(res)).toEqual(['2025-03-01', '2025-02-15', '2025-02-01', '2025-01-15', '2025-01-01']);
		expect(res.body.rows[1].type.name).toBe('Riven Mod');
		expect(res.body.rows[1].source.name).toBe("Archon's hunt");
		expect(res.body.rows[1].rivenType.name).toBe('rifle');
		expect(res.body.rows[2].booster.name).toBe('Affinity Booster');
	});

	it('returns the requested page with limit and offset', async () => {
		const res = await paged({ limit: 2, offset: 2 }).expect(200);
		expect(res.body.total).toBe(5);
		expect(days(res)).toEqual(['2025-02-01', '2025-01-15']);
	});

	it('sorts by date in ascending order', async () => {
		const res = await paged({ sort: 'date', order: 'asc', limit: 2 }).expect(200);
		expect(days(res)).toEqual(['2025-01-01', '2025-01-15']);
	});

	it('caps the page size at 100 and ignores invalid numbers', async () => {
		const huge = await paged({ limit: 1000 }).expect(200);
		expect(huge.body.rows).toHaveLength(5);
		const junk = await paged({ limit: 'abc', offset: -5 }).expect(200);
		expect(junk.body.rows).toHaveLength(5);
	});

	it('filters by type and by source (ids sent by the selects)', async () => {
		const byType = await filter({ 'type.name': ids.rivenMod }).expect(200);
		expect(byType.body.total).toBe(2);
		expect(byType.body.rows.every(r => r.type.name === 'Riven Mod')).toBe(true);
		const both = await filter({ 'type.name': ids.sculpture, 'source.name': ids.sortie }).expect(200);
		expect(days(both)).toEqual(['2025-03-01', '2025-01-01']);
	});

	it('filters the additional information : none, a booster type, a riven type', async () => {
		expect((await filter({ additionalInfo: '-' }).expect(200)).body.total).toBe(2);
		expect((await filter({ additionalInfo: 'b:' + ids.booster }).expect(200)).body.total).toBe(1);
		expect((await filter({ additionalInfo: 'r:' + ids.rifle }).expect(200)).body.total).toBe(2);
	});

	it('filters a date range, both bounds included', async () => {
		const between = await paged({ dateLow: '2025-01-15', dateHigh: '2025-02-15' }).expect(200);
		expect(days(between)).toEqual(['2025-02-15', '2025-02-01', '2025-01-15']);
		expect((await paged({ dateLow: '2025-02-02' }).expect(200)).body.total).toBe(2);
		expect((await paged({ dateHigh: '2025-01-01' }).expect(200)).body.total).toBe(1);
		// combined with a select
		expect((await filter({ 'type.name': ids.rivenMod }, { dateHigh: '2025-01-31' }).expect(200)).body.total).toBe(1);
	});

	it('ignores operators, unknown keys, invalid ids and dates (public input)', async () => {
		expect((await filter({ 'type.name': { $ne: null } }).expect(200)).body.total).toBe(5);
		expect((await filter({ $where: 'sleep(1000)', unknown: 'x' }).expect(200)).body.total).toBe(5);
		expect((await filter({ 'source.name': 'not-an-id', additionalInfo: 'b:nope' }).expect(200)).body.total).toBe(5);
		expect((await paged({ dateLow: '2025-02-02T00:00:00Z', dateHigh: 'tomorrow' }).expect(200)).body.total).toBe(5);
	});

	it('rejects a malformed filter', async () => {
		const res = await paged({ filter: 'not json' }).expect(400);
		expect(res.text).toMatch(/Invalid filter/);
		await paged({ filter: '42' }).expect(400);
	});
});
