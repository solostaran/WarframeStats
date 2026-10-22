'use strict';

// Integration test of the '/users' routes : router + jwt auth + passport + mongoose model + login pages,
// against the in-memory MongoDB of the run (tests/fixtures/memoryDb.js).

const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const jsonwebtoken = require('jsonwebtoken');
const mongoose = require('mongoose');
const request = require('supertest');
const db = require('#root/tests/fixtures/memoryDb.js');

// Mongoose Schema, before passport (its local strategy gets the model when required) and the router
require('#root/api/models/Users.js');
require('#root/security/passport.js');
const { sec_string, SESSION_DURATION_SECONDS, signToken } = require('#root/security/jwt_auth.js');

const Users = mongoose.model('Users');
const EMAIL = 'tester@example.com';
const PASSWORD = 'password';

// Same middlewares as app.js for these routes, with the views of the login pages
function buildApp() {
	const app = express();
	app.set('views', path.resolve(__dirname, '../../views'));
	app.set('view engine', 'pug');
	app.use(express.json());
	app.use(express.urlencoded({ extended: true }));	// user[email] of the login form -> req.body.user.email
	app.use(cookieParser());
	app.use(require('#root/security/utils/sanitizeBody.js'));
	app.use(require('#root/security/loginState.js'));
	app.locals.version = require('#root/package.json').version;
	app.use('/users', require('#root/api/routes/usersRoutes.js'));
	app.use(function(err, _req, res, _next) {
		res.status(err.status || 500).json({ name: err.name, message: err.message });
	});
	return app;
}

// A token signed by a previous run of the server (the signing secret is random at each startup)
function previousRunToken(user) {
	return jsonwebtoken.sign({ email: user.email, id: user._id, exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS }, 'previous secret');
}

function accessTokenCookie(res) {
	return (res.headers['set-cookie'] || []).find(cookie => cookie.startsWith('access_token='));
}

describe('/users routes', () => {
	let app;
	let user;

	const login = (email, password) => request(app).post('/users/login').send({ user: { email, password } });
	// the login form, as a browser posts it
	const form = (fields) => request(app).post('/users/loginFormProcess').type('form').send(fields);

	beforeAll(async () => {
		await db.connect(__filename);
		app = buildApp();
	});

	beforeEach(async () => {
		await db.clear();
		user = new Users({ email: EMAIL });
		user.setPassword(PASSWORD);
		await user.save();
	});

	afterAll(async () => {
		await db.disconnect();
	});

	// No sign-up route (anyone could create an account or reset a password) : resources/scripts/CreateUser.js
	describe('POST /users', () => {
		it('does not exist', async () => {
			await request(app).post('/users').send({ user: { email: EMAIL, password: 'new password' } }).expect(404);
			expect(await Users.countDocuments()).toBe(1);
			await login(EMAIL, PASSWORD).expect(200);
		});
	});

	describe('POST /users/login', () => {
		it('requires an email', async () => {
			const res = await request(app).post('/users/login').send({ user: { password: PASSWORD } }).expect(422);
			expect(res.body).toEqual({ errors: { error_email: 'is required' } });
		});

		it('requires a password', async () => {
			const res = await request(app).post('/users/login').send({ user: { email: EMAIL } }).expect(422);
			expect(res.body).toEqual({ errors: { error_password: 'is required' } });
		});

		it('answers 422 to a body without user, or without body', async () => {
			const res = await request(app).post('/users/login').send({}).expect(422);
			expect(res.body).toEqual({ errors: { error_email: 'is required' } });
			await request(app).post('/users/login').expect(422);
		});

		it('rejects an unknown email', async () => {
			const res = await login('unknown@example.com', PASSWORD).expect(400);
			expect(res.body).toEqual({ errors: { error_email: 'is invalid' } });
		});

		it('rejects a wrong password', async () => {
			const res = await login(EMAIL, 'wrong').expect(400);
			expect(res.body).toEqual({ errors: { error_password: 'is invalid' } });
		});

		it('returns a token of the user', async () => {
			const res = await login(EMAIL, PASSWORD).expect(200);
			expect(res.body.user).toMatchObject({ _id: String(user._id), email: EMAIL });
			expect(jsonwebtoken.verify(res.body.user.token, sec_string)).toMatchObject({ email: EMAIL, id: String(user._id) });
		});
	});

	describe('GET /users/current', () => {
		it('requires a token', async () => {
			await request(app).get('/users/current').expect(401);
		});

		it('returns the user of an Authorization header', async () => {
			const res = await request(app).get('/users/current').set('Authorization', 'Bearer ' + user.generateJWT()).expect(200);
			expect(res.body.user).toMatchObject({ _id: String(user._id), email: EMAIL });
		});

		it('returns the user of the access_token cookie', async () => {
			const res = await request(app).get('/users/current').set('Cookie', 'access_token=' + user.generateJWT()).expect(200);
			expect(res.body.user.email).toBe(EMAIL);
		});

		it('answers 400 for a deleted user', async () => {
			const token = user.generateJWT();
			await Users.deleteOne({ _id: user._id });
			await request(app).get('/users/current').set('Authorization', 'Bearer ' + token).expect(400);
		});

		it('rejects a token of a previous run of the server', async () => {
			await request(app).get('/users/current').set('Authorization', 'Bearer ' + previousRunToken(user)).expect(401);
		});
	});

	describe('GET /users/loginForm', () => {
		it('renders the login form', async () => {
			const res = await request(app).get('/users/loginForm').expect(200);
			expect(res.text).toContain('action="/users/loginFormProcess"');
		});
	});

	describe('POST /users/loginFormProcess', () => {
		it('requires an email', async () => {
			const res = await form({ 'user[password]': PASSWORD }).expect(200);
			expect(res.text).toContain('id="emailError"');
			expect(res.text).toContain('is required');
			expect(accessTokenCookie(res)).toBeUndefined();
		});

		it('renders the login page with its error for an empty body', async () => {
			const res = await form({}).expect(200);
			expect(res.text).toContain('id="emailError"');
		});

		it('requires a password, and keeps the email in the form', async () => {
			const res = await form({ 'user[email]': EMAIL }).expect(200);
			expect(res.text).toContain('id="passwordError"');
			expect(res.text).toContain('value="' + EMAIL + '"');
		});

		it('rejects a wrong password', async () => {
			const res = await form({ 'user[email]': EMAIL, 'user[password]': 'wrong' }).expect(200);
			expect(res.text).toContain('id="passwordError"');
			expect(res.text).toContain('is invalid');
			expect(accessTokenCookie(res)).toBeUndefined();
		});

		it('logs the user in with an access_token cookie', async () => {
			const res = await form({ 'user[email]': EMAIL, 'user[password]': PASSWORD }).expect(200);
			const cookie = accessTokenCookie(res);
			expect(cookie).toMatch(/HttpOnly/);
			expect(cookie).toMatch(new RegExp('Max-Age=' + SESSION_DURATION_SECONDS));
			expect(jsonwebtoken.verify(cookie.split(';')[0].split('=')[1], sec_string)).toMatchObject({ email: EMAIL, id: String(user._id) });
			expect(res.text).toContain(EMAIL);
			expect(res.text).toContain('logged.');
		});

		// loginState removes the cookie of a previous run, then the login sets the new one (the last Set-Cookie wins)
		it('logs the user in with a cookie of a previous run of the server', async () => {
			const res = await form({ 'user[email]': EMAIL, 'user[password]': PASSWORD })
				.set('Cookie', 'access_token=' + previousRunToken(user))
				.expect(200);
			const cookies = res.headers['set-cookie'].filter(cookie => cookie.startsWith('access_token='));
			expect(cookies[0]).toMatch(/^access_token=;/);
			expect(jsonwebtoken.verify(cookies.at(-1).split(';')[0].split('=')[1], sec_string)).toMatchObject({ email: EMAIL });
		});
	});

	describe('GET /users/disconnect', () => {
		it('renders the expired page without a session', async () => {
			const res = await request(app).get('/users/disconnect').expect(200);
			expect(res.text).toContain('No session or session has expired.');
		});

		it('clears the access_token cookie', async () => {
			const res = await request(app).get('/users/disconnect').set('Cookie', 'access_token=' + user.generateJWT()).expect(200);
			expect(accessTokenCookie(res)).toMatch(/^access_token=;.*Expires=Thu, 01 Jan 1970/);
			expect(res.text).toContain(EMAIL);
		});

		it('answers 400 for a deleted user', async () => {
			const token = user.generateJWT();
			await Users.deleteOne({ _id: user._id });
			await request(app).get('/users/disconnect').set('Cookie', 'access_token=' + token).expect(400);
		});

		it('renders the expired page for a cookie of a previous run of the server', async () => {
			const res = await request(app).get('/users/disconnect').set('Cookie', 'access_token=' + previousRunToken(user)).expect(200);
			expect(res.text).toContain('No session or session has expired.');
			expect(accessTokenCookie(res)).toMatch(/^access_token=;/);
		});
	});
});
