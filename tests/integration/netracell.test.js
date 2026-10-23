'use strict';

// Integration test of the '/netracell' routes : router + jwt auth + business process + mongoose models,
// against an in-memory MongoDB (no external database needed).

const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const request = require('supertest');
const db = require('#root/tests/fixtures/memoryDb.js');

// Mongoose Schemas, before the router (the business process gets its models when required)
require('#root/api/models/Users.js');
const { netracellRewardTypes, netracellRewardSources } = require('#root/api/models/netracellModel.js');

const Users = mongoose.model('Users');

// Same middlewares as app.js for these routes, without the views
function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(express.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(require('#root/security/utils/sanitizeBody.js'));
	app.use('/netracell', require('#root/api/routes/netracellRoutes.js'));
	app.use(function(err, _req, res, _next) {
		res.status(err.status || 500).json({ name: err.name, message: err.message });
	});
	return app;
}

describe('/netracell routes', () => {
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

	describe('GET /netracell/type/', () => {
		it('returns the netracell reward types without authentication', async () => {
			const res = await request(app).get('/netracell/type/').expect(200);
			expect(res.headers['content-type']).toMatch(/json/);
			expect(res.body).toEqual(netracellRewardTypes);
		});

		it('also accepts an authenticated user', async () => {
			const res = await request(app)
				.get('/netracell/type/')
				.set('Authorization', 'Bearer ' + token)
				.expect(200);
			expect(res.body).toEqual(netracellRewardTypes);
		});

		it('rejects an invalid token', async () => {
			await request(app)
				.get('/netracell/type/')
				.set('Authorization', 'Bearer invalid.token.value')
				.expect(401);
		});
	});

	describe('GET /netracell/source/', () => {
		it('returns the netracell reward sources without authentication', async () => {
			const res = await request(app).get('/netracell/source/').expect(200);
			expect(res.headers['content-type']).toMatch(/json/);
			expect(res.body).toEqual(netracellRewardSources);
		});

		it('also accepts an authenticated user', async () => {
			const res = await request(app)
				.get('/netracell/source/')
				.set('Authorization', 'Bearer ' + token)
				.expect(200);
			expect(res.body).toEqual(netracellRewardSources);
		});

		it('rejects an invalid token', async () => {
			await request(app)
				.get('/netracell/source/')
				.set('Authorization', 'Bearer invalid.token.value')
				.expect(401);
		});
	});

	describe('authentication on writes', () => {
		it.each(['/netracell/add', '/netracell/adds', '/netracell/setTypes', '/netracell/setSources'])('POST %s requires a token', async (path) => {
			await request(app).post(path).send({}).expect(401);
		});
	});

	describe('netracell rewards lifecycle', () => {
		let createdId;

		it('GET /netracell/raw is empty at first', async () => {
			const res = await request(app).get('/netracell/raw').expect(200);
			expect(res.body).toEqual([]);
		});

		it('POST /netracell/setTypes inserts every reward type', async () => {
			const res = await request(app)
				.post('/netracell/setTypes')
				.set('Authorization', 'Bearer ' + token)
				.expect(200);
			expect(res.body.insertedCount).toBe(netracellRewardTypes.length);
			expect(res.body.rejectedCount).toBe(0);
		});

		it('POST /netracell/setSources inserts every reward source', async () => {
			const res = await request(app)
				.post('/netracell/setSources')
				.set('Authorization', 'Bearer ' + token)
				.expect(200);
			expect(res.body.insertedCount).toBe(netracellRewardSources.length);
			expect(res.body.rejectedCount).toBe(0);
		});

		it('POST /netracell/add creates a netracell reward', async () => {
			const res = await request(app)
				.post('/netracell/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Netracell', reward: 'Crimson Archon Shard', tauforged: true, date: '2024-12-16' })
				.expect(200);
			expect(res.body._id).toBeDefined();
			expect(res.body.source.type).toBe('Netracell');
			// the former body : reward and tauforged are the single loot
			expect(res.body.loots).toEqual([{ reward: expect.objectContaining({ type: 'Crimson Archon Shard' }), tauforged: true }]);
			createdId = res.body._id;
		});

		it('POST /netracell/add accepts the token from the access_token cookie', async () => {
			await request(app)
				.post('/netracell/add')
				.set('Cookie', 'access_token=' + token)
				.send({ source: 'Deep Archimedea', reward: 'Melee Duplicate', date: '2024-12-10' })
				.expect(200);
		});

		it('POST /netracell/add creates a Deep Archimedea run with 3 loots', async () => {
			const res = await request(app)
				.post('/netracell/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Deep Archimedea', date: '2024-12-05', loots: [
					{ reward: 'Amber Archon Shard', tauforged: 'true' },
					{ reward: 'Melee Crescendo', tauforged: true },
					{ reward: 'Melee Arcane Adapter' }
				] })
				.expect(200);
			expect(res.body.loots.map(loot => loot.reward.type)).toEqual(['Amber Archon Shard', 'Melee Crescendo', 'Melee Arcane Adapter']);
			// only a shard can be tauforged
			expect(res.body.loots.map(loot => loot.tauforged)).toEqual([true, undefined, undefined]);
		});

		it('POST /netracell/add rejects a Netracell run with 2 loots', async () => {
			const res = await request(app)
				.post('/netracell/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Netracell', date: '2024-12-05', loots: [{ reward: 'Amber Archon Shard' }, { reward: 'Melee Duplicate' }] })
				.expect(400);
			expect(res.text).toMatch(/A Netracell reward has 1 loot/);
		});

		it('POST /netracell/add rejects a Deep Archimedea run with 4 loots', async () => {
			const res = await request(app)
				.post('/netracell/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Deep Archimedea', date: '2024-12-05', loots: Array(4).fill({ reward: 'Melee Duplicate' }) })
				.expect(400);
			expect(res.text).toMatch(/A Deep Archimedea reward has 1 to 3 loots/);
		});

		it('POST /netracell/add rejects a run without loot', async () => {
			const res = await request(app)
				.post('/netracell/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Deep Archimedea', date: '2024-12-05', loots: [] })
				.expect(400);
			expect(res.text).toMatch(/1 to 3 loots/);
		});

		it('POST /netracell/add rejects an unknown reward type', async () => {
			const res = await request(app)
				.post('/netracell/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Netracell', reward: 'Crimson Truc Shard' })
				.expect(400);
			expect(res.text).toMatch(/Wrong netracell reward type/);
		});

		it('POST /netracell/add rejects a reward without source', async () => {
			const res = await request(app)
				.post('/netracell/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ reward: 'Crimson Archon Shard', date: '2024-12-16' })
				.expect(400);
			expect(res.text).toMatch(/Wrong netracell reward source/);
		});

		it('POST /netracell/add rejects an unknown reward source', async () => {
			const res = await request(app)
				.post('/netracell/add')
				.set('Authorization', 'Bearer ' + token)
				.send({ source: 'Sortie', reward: 'Crimson Archon Shard', date: '2024-12-16' })
				.expect(400);
			expect(res.text).toMatch(/Wrong netracell reward source/);
		});

		it('POST /netracell/adds counts the inserted and rejected rewards', async () => {
			const res = await request(app)
				.post('/netracell/adds')
				.set('Authorization', 'Bearer ' + token)
				.send([
					{ source: 'Netracell', reward: 'Azure Archon Shard', date: '2024-12-01' },
					{ source: 'Netracell', reward: 'Not A Reward' },
					{ reward: 'Amber Archon Shard' },
				])
				.expect(200);
			expect(res.body.insertedCount).toBe(1);
			expect(res.body.rejectedCount).toBe(2);
			expect(res.body.rejects.map(r => r.reject)).toEqual(expect.arrayContaining([
				{ source: 'Netracell', reward: 'Not A Reward' },
				{ reward: 'Amber Archon Shard' }
			]));
		});

		it('GET /netracell/raw lists the rewards, newest date first', async () => {
			const res = await request(app).get('/netracell/raw').expect(200);
			expect(res.body.map(n => n.rewards)).toEqual([
				'Crimson Archon Shard (Tauforged)', 'Melee Duplicate',
				'Amber Archon Shard (Tauforged), Melee Crescendo, Melee Arcane Adapter', 'Azure Archon Shard'
			]);
			expect(res.body.map(n => n.lootCount)).toEqual([1, 1, 3, 1]);
			expect(res.body.map(n => n.source)).toEqual(['Netracell', 'Deep Archimedea', 'Deep Archimedea', 'Netracell']);
		});

		it('GET /netracell/:id returns the reward with an obfuscated creator', async () => {
			const res = await request(app).get('/netracell/' + createdId).expect(200);
			expect(res.body._id).toBe(createdId);
			expect(res.body.loots[0].reward.type).toBe('Crimson Archon Shard');
			expect(res.body.source.type).toBe('Netracell');
			expect(res.body.createdBy).toEqual({ email: expect.any(String) });
			expect(res.body.createdBy.email).not.toBe('tester@example.com');
		});

		it('GET /netracell/:id returns 404 for an unknown id', async () => {
			await request(app).get('/netracell/' + new mongoose.Types.ObjectId()).expect(404);
		});

		it('GET /netracell/:id returns 500 for a malformed id', async () => {
			await request(app).get('/netracell/not-an-id').expect(500);
		});
	});

	// the generic form (web/forms/definitions/netracell.js) : its fields, validated by the form engine, become the loots
	describe('netracell form', () => {
		const definition = require('#root/web/forms/definitions/netracell.js');
		const formEngine = require('#root/web/forms/formEngine.js');
		const userId = new mongoose.Types.ObjectId();

		async function saveForm(body, id) {
			const { values, errors } = formEngine.validate(await definition.fields(), body);
			expect(errors).toEqual({});
			return definition.save(values, userId, id);
		}

		it('saves a Deep Archimedea run with 3 loots and loads it back', async () => {
			const saved = await saveForm({ source: 'Deep Archimedea', date: '2024-11-20',
				reward: 'Azure Archon Shard', tauforged: 'true',
				reward2: 'Melee Duplicate',
				reward3: 'Crimson Archon Shard', tauforged3: 'false' });
			const record = await definition.load(String(saved._id));
			expect(record.values).toEqual({ source: 'Deep Archimedea', date: '2024-11-20',
				reward: 'Azure Archon Shard', tauforged: 'true',
				reward2: 'Melee Duplicate', tauforged2: 'false',
				reward3: 'Crimson Archon Shard', tauforged3: 'false' });
		});

		it('ignores the loots 2 and 3 of a Netracell run (hidden fields)', async () => {
			const saved = await saveForm({ source: 'Netracell', date: '2024-11-21',
				reward: 'Melee Crescendo', reward2: 'Melee Duplicate', reward3: 'Amber Archon Shard' });
			expect(saved.loots.map(loot => loot.reward.type)).toEqual(['Melee Crescendo']);
		});

		it('requires the tauforged choice of a shard loot', async () => {
			const { errors } = formEngine.validate(await definition.fields(),
				{ source: 'Deep Archimedea', date: '2024-11-22', reward: 'Melee Crescendo', reward2: 'Amber Archon Shard' });
			expect(errors).toEqual({ tauforged2: 'Required' });
		});
	});
});
