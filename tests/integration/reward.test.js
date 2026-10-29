'use strict';

// Integration test of the '/reward' routes : router + jwt auth + business process + mongoose models,
// against an in-memory MongoDB.

const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const request = require('supertest');
const db = require('#root/tests/fixtures/memoryDb.js');

// Mongoose Schemas (same order as app.js), before the router (the business processes get their models when required)
require('#root/api/models/rivenTypeModel.js');
require('#root/api/models/rivenSourceModel.js');
require('#root/api/models/rivenConditionModel.js');
require('#root/api/models/rivenModel.js');
require('#root/api/models/boosterTypeModel.js');
require('#root/api/models/rewardTypeModel.js');
require('#root/api/models/rewardSourceModel.js');
require('#root/api/models/rewardModel.js');
require('#root/api/models/Users.js');

const Reward = mongoose.model('Reward');
const Riven = mongoose.model('Riven');
const Users = mongoose.model('Users');

// Same middlewares as app.js for these routes, without the views
function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(express.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(require('#root/security/utils/sanitizeBody.js'));
	app.use('/reward', require('#root/api/routes/rewardRoutes.js'));
	app.use(function(err, _req, res, _next) {
		res.status(err.status || 500).json({ name: err.name, message: err.message });
	});
	return app;
}

describe('GET /reward/paged', () => {
	let app;
	let ids;	// ids of the seeded references

	const paged = (query = {}) => request(app).get('/reward/paged').query(query);
	const filter = (f, query = {}) => paged({ ...query, filter: JSON.stringify(f) });
	const days = res => res.body.rows.map(r => r.date.substring(0, 10));

	beforeAll(async () => {
		await db.connect(__filename);
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
		await db.disconnect();
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

describe('/reward writes and reads', () => {
	let app;
	let token;
	let userId;
	let ids;	// ids of the seeded references

	const add = form => request(app).post('/reward/add').set('Authorization', 'Bearer ' + token).send(form);
	const sculpture = (date = '2025-04-01') => ({ type: 'Anasa Ayatan Sculpture', source: 'Sortie', date: date });

	// the paged suite dropped the database when it disconnected
	beforeAll(async () => {
		await db.connect(__filename);
		app = buildApp();

		const user = new Users({ email: 'tester@example.com' });
		user.setPassword('password');
		await user.save();
		token = user.generateJWT();
		userId = user.id;

		const [statue] = await mongoose.model('RewardType').create([{ name: 'Anasa Ayatan Sculpture' }, { name: 'Riven Mod' }, { name: 'Affinity Booster' }]);
		const sortie = await mongoose.model('RewardSource').create({ name: 'Sortie' });
		// a riven gets the riven source that has the name of the reward source
		await mongoose.model('RivenSource').create({ name: 'Sortie' });
		await mongoose.model('RivenType').create({ name: 'rifle' });
		await mongoose.model('BoosterType').create({ name: 'Affinity Booster', description: 'x2 affinity' });
		ids = { sculpture: statue.id, sortie: sortie.id };
	});

	afterAll(async () => {
		await db.disconnect();
	});

	describe('authentication on writes', () => {
		it.each([
			['post', '/reward/add'],
			['post', '/reward/adds'],
			['delete', '/reward/delete/' + new mongoose.Types.ObjectId()],
			['delete', '/reward/deleteall'],
		])('%s %s requires a token', async (method, path) => {
			await request(app)[method](path).send({}).expect(401);
		});

		it('rejects an invalid token', async () => {
			await request(app)
				.post('/reward/add')
				.set('Authorization', 'Bearer invalid.token.value')
				.send(sculpture())
				.expect(401);
		});

		it('accepts the token from the access_token cookie', async () => {
			await request(app)
				.post('/reward/add')
				.set('Cookie', 'access_token=' + token)
				.send(sculpture())
				.expect(200);
		});
	});

	describe('POST /reward/add', () => {
		it('creates a reward from the names of its type and source', async () => {
			const res = await add(sculpture('2025-04-01')).expect(200);
			expect(res.body._id).toBeDefined();
			expect(res.body.type).toBe(ids.sculpture);
			expect(res.body.source).toBe(ids.sortie);
			expect(res.body.createdBy).toBe(userId);
			expect(res.body.date).toBe('2025-04-01T12:00:00.000Z');	// a day, at 12:00 UTC
		});

		it('also accepts the ids of its type and source', async () => {
			const res = await add({ type: ids.sculpture, source: ids.sortie, date: '2025-04-02' }).expect(200);
			expect(res.body.type).toBe(ids.sculpture);
		});

		it('needs a booster type for a booster reward', async () => {
			const res = await add({ type: 'Affinity Booster', source: 'Sortie', date: '2025-04-03', booster: 'Affinity Booster' }).expect(200);
			expect(res.body.booster).toBeDefined();
			const missing = await add({ type: 'Affinity Booster', source: 'Sortie', date: '2025-04-03' }).expect(400);
			expect(missing.text).toMatch(/Invalid body/);
		});

		it('creates a riven reward, without or with an unveiled riven', async () => {
			const veiled = await add({ type: 'Riven Mod', source: 'Sortie', date: '2025-04-04', rivenType: 'rifle' }).expect(200);
			expect(veiled.body.rivenType).toBeDefined();
			expect(veiled.body.riven).toBeUndefined();

			const unveiled = await add({ type: 'Riven Mod', source: 'Sortie', date: '2025-04-05', rivenType: 'rifle', rivenWeaponName: 'Braton' }).expect(200);
			const riven = await Riven.findById(unveiled.body.riven).exec();
			expect(riven.weaponName).toBe('Braton');
			expect(riven.reward.toString()).toBe(unveiled.body._id);
		});

		it('updates a reward : a riven reward turned into a sculpture loses its riven', async () => {
			const created = await add({ type: 'Riven Mod', source: 'Sortie', date: '2025-04-06', rivenType: 'rifle', rivenWeaponName: 'Soma' }).expect(200);
			const rivenId = created.body.riven;

			const res = await add({ ...sculpture('2025-04-06'), _id: created.body._id }).expect(200);
			expect(res.body._id).toBe(created.body._id);
			expect(res.body.type).toBe(ids.sculpture);
			expect(res.body.riven).toBeNull();
			expect(res.body.rivenType).toBeNull();
			expect(res.body.modifiedBy).toBe(userId);
			expect(res.body.Modified_date).toBeDefined();
			expect(await Riven.findById(rivenId).exec()).toBeNull();
		});

		it.each([
			['an unknown type', { type: 'Nope', source: 'Sortie', date: '2025-04-07' }],
			['an unknown source', { type: 'Anasa Ayatan Sculpture', source: 'Nope', date: '2025-04-07' }],
			['no date', { type: 'Anasa Ayatan Sculpture', source: 'Sortie' }],
			['an unknown id', { _id: new mongoose.Types.ObjectId().toString(), type: 'Anasa Ayatan Sculpture', source: 'Sortie', date: '2025-04-07' }],
		])('rejects %s', async (_label, form) => {
			const res = await add(form).expect(400);
			expect(res.text).toMatch(/Invalid body/);
		});

		it('rejects an empty body', async () => {
			await request(app).post('/reward/add').set('Authorization', 'Bearer ' + token).expect(400);
		});
	});

	describe('POST /reward/adds', () => {
		it('inserts the valid rewards and reports the rejected ones', async () => {
			const invalid = { type: 'Nope', source: 'Sortie', date: '2025-05-01' };
			const res = await request(app)
				.post('/reward/adds')
				.set('Authorization', 'Bearer ' + token)
				.send([sculpture('2025-05-01'), invalid])
				.expect(200);
			expect(res.body.insertedCount).toBe(1);
			expect(res.body.rejectedCount).toBe(1);
			expect(res.body.rejects).toHaveLength(1);
			expect(res.body.rejects[0].reject).toEqual(invalid);
		});

		it('rejects a body that is not an array', async () => {
			const res = await request(app)
				.post('/reward/adds')
				.set('Authorization', 'Bearer ' + token)
				.send({})
				.expect(400);
			expect(res.text).toMatch(/Invalid body/);
		});
	});

	describe('GET /reward/raw', () => {
		it('returns every reward, newest first, with the populated references, without authentication', async () => {
			const res = await request(app).get('/reward/raw').expect(200);
			expect(res.body.length).toBe(await Reward.countDocuments());
			const dates = res.body.map(r => r.date);
			expect(dates).toEqual([...dates].sort().reverse());
			expect(res.body.every(r => typeof r.type.name === 'string' && typeof r.source.name === 'string')).toBe(true);
			expect(res.body.find(r => r.booster).booster.name).toBe('Affinity Booster');
			expect(res.body.find(r => r.rivenType).rivenType.name).toBe('rifle');
		});
	});

	describe('GET /reward/:id', () => {
		it('returns the populated reward, its riven, and only the obfuscated email of its creator', async () => {
			const created = await add({ type: 'Riven Mod', source: 'Sortie', date: '2025-06-01', rivenType: 'rifle', rivenWeaponName: 'Lanka' }).expect(200);
			const res = await request(app).get('/reward/' + created.body._id).expect(200);
			expect(res.body.type.name).toBe('Riven Mod');
			expect(res.body.source.name).toBe('Sortie');
			expect(res.body.rivenType.name).toBe('rifle');
			expect(res.body.riven.weaponName).toBe('Lanka');
			expect(res.body.riven.type.name).toBe('rifle');
			expect(res.body.createdBy).toEqual({ email: 'tes************com' });
		});

		it('also obfuscates the email of its last modifier', async () => {
			const created = await add(sculpture('2025-06-02')).expect(200);
			await add({ ...sculpture('2025-06-03'), _id: created.body._id }).expect(200);
			const res = await request(app).get('/reward/' + created.body._id).expect(200);
			expect(res.body.modifiedBy).toEqual({ email: 'tes************com' });
		});

		it('returns 404 for an unknown id', async () => {
			await request(app).get('/reward/' + new mongoose.Types.ObjectId()).expect(404);
		});

		it('returns 404 for a malformed id', async () => {
			await request(app).get('/reward/not-an-id').expect(404);
		});
	});

	describe('DELETE /reward/delete/:id', () => {
		const remove = id => request(app).delete('/reward/delete/' + id).set('Authorization', 'Bearer ' + token);

		it('deletes a reward and returns it', async () => {
			const created = await add(sculpture('2025-07-01')).expect(200);
			const res = await remove(created.body._id).expect(200);
			expect(res.body._id).toBe(created.body._id);
			await request(app).get('/reward/' + created.body._id).expect(404);
		});

		it('rejects an unknown id', async () => {
			const res = await remove(new mongoose.Types.ObjectId()).expect(400);
			expect(res.text).toMatch(/Cannot delete/);
		});

		// a riven outlives its reward
		it('keeps the riven of a deleted riven reward', async () => {
			const created = await add({ type: 'Riven Mod', source: 'Sortie', date: '2025-07-02', rivenType: 'rifle', rivenWeaponName: 'Rubico' }).expect(200);
			await remove(created.body._id).expect(200);
			expect((await Riven.findById(created.body.riven).exec()).weaponName).toBe('Rubico');
		});
	});

	describe('DELETE /reward/deleteall', () => {
		it('deletes every reward', async () => {
			const count = await Reward.countDocuments();
			const res = await request(app).delete('/reward/deleteall').set('Authorization', 'Bearer ' + token).expect(200);
			expect(res.body.deletedCount).toBe(count);
			expect((await request(app).get('/reward/raw').expect(200)).body).toEqual([]);
		});
	});
});
