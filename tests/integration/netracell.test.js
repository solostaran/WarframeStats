'use strict';

// Integration test of the '/netracell' routes : router + jwt auth + business process + mongoose models,
// against an in-memory MongoDB (no external database needed).

const express = require('express');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mongoose Schemas, before the router (the business process gets its models when required)
require('../../api/models/Users');
const { netracellRewardTypes, netracellRewardSources } = require('../../api/models/netracellModel');

const Users = mongoose.model('Users');

// Same middlewares as app.js for these routes, without the views
function buildApp() {
	const app = express();
	app.use(express.json());
	app.use(express.urlencoded({ extended: false }));
	app.use(cookieParser());
	app.use(require('../../config/sanitizeBody'));
	app.use('/netracell', require('../../routes/netracellRoutes'));
	app.use(function(err, _req, res, _next) {
		res.status(err.status || 500).json({ name: err.name, message: err.message });
	});
	return app;
}

describe('/netracell routes', () => {
	let mongoServer;
	let app;
	let token;

	beforeAll(async () => {
		mongoServer = await MongoMemoryServer.create();
		await mongoose.connect(mongoServer.getUri());
		app = buildApp();

		const user = new Users({ email: 'tester@example.com' });
		user.setPassword('password');
		await user.save();
		token = user.generateJWT();
	});

	afterAll(async () => {
		await mongoose.disconnect();
		await mongoServer.stop();
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
			expect(res.body.tauforged).toBe(true);
			createdId = res.body._id;
		});

		it('POST /netracell/add accepts the token from the access_token cookie', async () => {
			await request(app)
				.post('/netracell/add')
				.set('Cookie', 'access_token=' + token)
				.send({ source: 'Deep Archimedea', reward: 'Melee Duplicate', date: '2024-12-10' })
				.expect(200);
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
			expect(res.body.map(n => n.reward)).toEqual(['Crimson Archon Shard', 'Melee Duplicate', 'Azure Archon Shard']);
			expect(res.body.map(n => n.source)).toEqual(['Netracell', 'Deep Archimedea', 'Netracell']);
		});

		it('GET /netracell/:id returns the reward with an obfuscated creator', async () => {
			const res = await request(app).get('/netracell/' + createdId).expect(200);
			expect(res.body._id).toBe(createdId);
			expect(res.body.reward.type).toBe('Crimson Archon Shard');
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
});
