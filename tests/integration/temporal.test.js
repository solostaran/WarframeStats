'use strict';

// Integration test of the '/temporal' routes : router + jwt auth + business process + mongoose models,
// against an in-memory MongoDB (no external database needed).

const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const request = require('supertest');
const db = require('#root/tests/fixtures/memoryDb.js');

// Mongoose Schemas, before the router (the business process gets its models when required)
require('#root/api/models/Users.js');
const { temporalRewardTypes, temporalRewardSources } = require('#root/api/models/temporalModel.js');

const Users = mongoose.model('Users');

// Same middlewares as app.js for these routes, without the views
function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(express.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(require('#root/security/utils/sanitizeBody.js'));
	app.use('/temporal', require('#root/api/routes/temporalRoutes.js'));
	app.use(function(err, _req, res, _next) {
		res.status(err.status || 500).json({ name: err.name, message: err.message });
	});
	return app;
}

describe('/temporal routes', () => {
	let app;
	let token;

	beforeAll(async () => {
		await db.connect(__filename);
		app = buildApp();

		const user = new Users({ email: 'tester@example.com' });
		user.setPassword('password');
		await user.save();
		token = user.generateJWT();
	});

	afterAll(async () => {
		await db.disconnect();
	});

	describe('GET /temporal/type/', () => {
		it('returns the 12 temporal reward types without authentication', async () => {
			const res = await request(app).get('/temporal/type/').expect(200);
			expect(res.headers['content-type']).toMatch(/json/);
			expect(res.body).toEqual(temporalRewardTypes);
			expect(res.body).toHaveLength(12);
		});

		it('rejects an invalid token', async () => {
			await request(app)
				.get('/temporal/type/')
				.set('Authorization', 'Bearer invalid.token.value')
				.expect(401);
		});
	});

	describe('GET /temporal/source/', () => {
		it('returns the temporal reward sources without authentication', async () => {
			const res = await request(app).get('/temporal/source/').expect(200);
			expect(res.headers['content-type']).toMatch(/json/);
			expect(res.body).toEqual(['Temporal Archimedea']);
		});
	});

	describe('authentication on writes', () => {
		it.each(['/temporal/add', '/temporal/adds', '/temporal/setTypes', '/temporal/setSources'])('POST %s requires a token', async (path) => {
			await request(app).post(path).send({}).expect(401);
		});
	});

	describe('temporal rewards lifecycle', () => {
		let createdId;

		it('GET /temporal/raw is empty at first', async () => {
			const res = await request(app).get('/temporal/raw').expect(200);
			expect(res.body).toEqual([]);
		});

		it('POST /temporal/setTypes inserts every reward type', async () => {
			const res = await request(app)
				.post('/temporal/setTypes')
				.set('Authorization', 'Bearer ' + token)
				.expect(200);
			expect(res.body.insertedCount).toBe(temporalRewardTypes.length);
			expect(res.body.rejectedCount).toBe(0);
		});

		it('POST /temporal/setSources inserts every reward source', async () => {
			const res = await request(app)
				.post('/temporal/setSources')
				.set('Authorization', 'Bearer ' + token)
				.expect(200);
			expect(res.body.insertedCount).toBe(temporalRewardSources.length);
			expect(res.body.rejectedCount).toBe(0);
		});

		it('POST /temporal/add creates a run with 1 loot', async () => {
			const res = await request(app)
				.post('/temporal/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Temporal Archimedea', date: '2026-10-15', loots: [{ reward: 'Violet Archon Shard', tauforged: true }] })
				.expect(200);
			expect(res.body._id).toBeDefined();
			expect(res.body.source.type).toBe('Temporal Archimedea');
			expect(res.body.loots).toEqual([{ reward: expect.objectContaining({ type: 'Violet Archon Shard' }), tauforged: true }]);
			createdId = res.body._id;
		});

		it('POST /temporal/add accepts the token from the access_token cookie', async () => {
			await request(app)
				.post('/temporal/add')
				.set('Cookie', 'access_token=' + token)
				.send({ source: 'Temporal Archimedea', date: '2026-10-12', loots: [{ reward: 'Elemental Vice' }, { reward: 'Arcane Hot Shot' }] })
				.expect(200);
		});

		it('POST /temporal/add creates a run with 3 loots, only a shard is tauforged', async () => {
			const res = await request(app)
				.post('/temporal/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Temporal Archimedea', date: '2026-10-08', loots: [
					{ reward: 'Emerald Archon Shard', tauforged: 'true' },
					{ reward: 'Omni Forma', tauforged: true },
					{ reward: 'Omni Forma Blueprint' }
				] })
				.expect(200);
			expect(res.body.loots.map(loot => loot.reward.type)).toEqual(['Emerald Archon Shard', 'Omni Forma', 'Omni Forma Blueprint']);
			expect(res.body.loots.map(loot => loot.tauforged)).toEqual([true, undefined, undefined]);
		});

		it('POST /temporal/add rejects a run with 4 loots', async () => {
			const res = await request(app)
				.post('/temporal/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Temporal Archimedea', date: '2026-10-05', loots: Array(4).fill({ reward: 'Omni Forma' }) })
				.expect(400);
			expect(res.text).toMatch(/A Temporal Archimedea reward has 1 to 3 loots/);
		});

		it('POST /temporal/add rejects a run without loot', async () => {
			const res = await request(app)
				.post('/temporal/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Temporal Archimedea', date: '2026-10-05', loots: [] })
				.expect(400);
			expect(res.text).toMatch(/1 to 3 loots/);
		});

		it('POST /temporal/add rejects an unknown reward type', async () => {
			const res = await request(app)
				.post('/temporal/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Temporal Archimedea', loots: [{ reward: 'Melee Duplicate' }] })
				.expect(400);
			expect(res.text).toMatch(/Wrong temporal reward type/);
		});

		it('POST /temporal/add rejects a reward without source', async () => {
			const res = await request(app)
				.post('/temporal/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ loots: [{ reward: 'Omni Forma' }], date: '2026-10-05' })
				.expect(400);
			expect(res.text).toMatch(/Wrong temporal reward source/);
		});

		it('POST /temporal/add rejects an unknown reward source', async () => {
			const res = await request(app)
				.post('/temporal/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Deep Archimedea', loots: [{ reward: 'Omni Forma' }], date: '2026-10-05' })
				.expect(400);
			expect(res.text).toMatch(/Wrong temporal reward source/);
		});

		it('POST /temporal/adds counts the inserted and rejected rewards', async () => {
			const res = await request(app)
				.post('/temporal/adds')
				.set('Authorization', 'Bearer ' + token)
				.send([
					{ source: 'Temporal Archimedea', date: '2026-10-01', loots: [{ reward: 'Arcane Escapist' }] },
					{ source: 'Temporal Archimedea', loots: [{ reward: 'Not A Reward' }] },
					{ loots: [{ reward: 'Omni Forma' }] },
				])
				.expect(200);
			expect(res.body.insertedCount).toBe(1);
			expect(res.body.rejectedCount).toBe(2);
		});

		it('GET /temporal/raw lists the rewards, newest date first', async () => {
			const res = await request(app).get('/temporal/raw').expect(200);
			expect(res.body.map(t => t.rewards)).toEqual([
				'Violet Archon Shard (Tauforged)', 'Elemental Vice, Arcane Hot Shot',
				'Emerald Archon Shard (Tauforged), Omni Forma, Omni Forma Blueprint', 'Arcane Escapist'
			]);
			expect(res.body.map(t => t.lootCount)).toEqual([1, 2, 3, 1]);
			expect(res.body.map(t => t.source)).toEqual(Array(4).fill('Temporal Archimedea'));
		});

		it('GET /temporal/:id returns the reward with an obfuscated creator', async () => {
			const res = await request(app).get('/temporal/' + createdId).expect(200);
			expect(res.body._id).toBe(createdId);
			expect(res.body.loots[0].reward.type).toBe('Violet Archon Shard');
			expect(res.body.createdBy).toEqual({ email: expect.any(String) });
			expect(res.body.createdBy.email).not.toBe('tester@example.com');
		});

		it('GET /temporal/:id returns 404 for an unknown id', async () => {
			await request(app).get('/temporal/' + new mongoose.Types.ObjectId()).expect(404);
		});
	});

	// the generic form (web/forms/definitions/temporal.js) : its fields, validated by the form engine, become the loots
	describe('temporal form', () => {
		const definition = require('#root/web/forms/definitions/temporal.js');
		const formEngine = require('#root/web/forms/formEngine.js');
		const userId = new mongoose.Types.ObjectId();

		async function saveForm(body, id) {
			const { values, errors } = formEngine.validate(await definition.fields(), body);
			expect(errors).toEqual({});
			return definition.save(values, userId, id);
		}

		it('selects the source "Temporal Archimedea" by default', async () => {
			const source = (await definition.fields()).find(field => field.name === 'source');
			expect(source.default).toBe('Temporal Archimedea');
		});

		it('saves a run with 3 loots and loads it back', async () => {
			const saved = await saveForm({ source: 'Temporal Archimedea', date: '2026-09-20',
				reward: 'Topaz Archon Shard', tauforged: 'true',
				reward2: 'Arcane Universal Fallout',
				reward3: 'Crimson Archon Shard', tauforged3: 'false' });
			const record = await definition.load(String(saved._id));
			expect(record.values).toEqual({ source: 'Temporal Archimedea', date: '2026-09-20',
				reward: 'Topaz Archon Shard', tauforged: 'true',
				reward2: 'Arcane Universal Fallout', tauforged2: 'false',
				reward3: 'Crimson Archon Shard', tauforged3: 'false' });
		});

		it('ignores the loot 3 without a loot 2 (hidden field)', async () => {
			const saved = await saveForm({ source: 'Temporal Archimedea', date: '2026-09-21',
				reward: 'Omni Forma', reward3: 'Elemental Vice' });
			expect(saved.loots.map(loot => loot.reward.type)).toEqual(['Omni Forma']);
		});

		it('requires the tauforged choice of a shard loot', async () => {
			const { errors } = formEngine.validate(await definition.fields(),
				{ source: 'Temporal Archimedea', date: '2026-09-22', reward: 'Omni Forma', reward2: 'Amber Archon Shard' });
			expect(errors).toEqual({ tauforged2: 'Required' });
		});
	});
});
