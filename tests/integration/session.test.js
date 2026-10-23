'use strict';

// Integration test of the sliding session : security/loginState.js renews the "access_token" cookie of an active user.

const express = require('express');
const cookieParser = require('cookie-parser');
const jsonwebtoken = require('jsonwebtoken');
const request = require('supertest');
const { sec_string, SESSION_DURATION_SECONDS, signToken } = require('#root/security/jwt_auth.js');

const payload = { email: 'tester@example.com', id: '0123456789abcdef01234567' };

function buildApp() {
	const app = express();
	app.use(cookieParser());
	app.use(require('#root/security/loginState.js'));
	// token : the cookie seen by the next middlewares (auth.optional of the routes)
	app.get('/', (req, res) => res.json({ connected: res.locals.connected, token: req.cookies['access_token'] }));
	return app;
}

// A token issued "secondsAgo" seconds ago, expiring "expiresIn" seconds after that
function oldToken(secondsAgo, expiresIn) {
	const iat = Math.floor(Date.now() / 1000) - secondsAgo;
	return jsonwebtoken.sign({ ...payload, iat: iat, exp: iat + expiresIn }, sec_string);
}

function accessTokenCookie(res) {
	return (res.headers['set-cookie'] || []).find(cookie => cookie.startsWith('access_token='));
}

describe('sliding session', () => {
	const app = buildApp();

	it('renews a token issued 5 minutes ago for the full session duration', async () => {
		const res = await request(app).get('/').set('Cookie', 'access_token=' + oldToken(5 * 60, SESSION_DURATION_SECONDS)).expect(200);
		expect(res.body.connected).toBe(true);
		const cookie = accessTokenCookie(res);
		expect(cookie).toMatch(/HttpOnly/);
		expect(cookie).toMatch(new RegExp('Max-Age=' + SESSION_DURATION_SECONDS));
		const renewed = jsonwebtoken.verify(cookie.split(';')[0].split('=')[1], sec_string);
		expect(renewed).toMatchObject(payload);
		expect(renewed.exp - Math.floor(Date.now() / 1000)).toBeGreaterThan(SESSION_DURATION_SECONDS - 5);
	});

	it('does not renew a token issued less than a minute ago', async () => {
		const res = await request(app).get('/').set('Cookie', 'access_token=' + signToken(payload)).expect(200);
		expect(res.body.connected).toBe(true);
		expect(accessTokenCookie(res)).toBeUndefined();
	});

	it('removes an expired token instead of renewing it', async () => {
		const res = await request(app).get('/').set('Cookie', 'access_token=' + oldToken(SESSION_DURATION_SECONDS + 60, SESSION_DURATION_SECONDS)).expect(200);
		expect(res.body).toEqual({ connected: false });
		expect(accessTokenCookie(res)).toMatch(/^access_token=;.*Expires=Thu, 01 Jan 1970/);
	});

	it('removes a token signed before a restart of the server', async () => {
		const res = await request(app).get('/').set('Cookie', 'access_token=' + jsonwebtoken.sign(payload, 'previous secret')).expect(200);
		expect(res.body).toEqual({ connected: false });
		expect(accessTokenCookie(res)).toMatch(/^access_token=;.*Expires=Thu, 01 Jan 1970/);
	});
});
