'use strict';

// Per request login state for the PUG templates (res.locals.connected).
// The "access_token" cookie is verified the same way as security/jwt_auth.js does,
// but an invalid or expired token never raises an error : the visitor is simply not connected.
// Such a cookie (e.g. signed before a restart of the server, the secret is random at each startup) is removed,
// so the routes with auth.optional see a visitor instead of rejecting the request (express-jwt rejects an invalid token, 401).
// A valid token older than RENEW_AFTER_SECONDS is renewed : the session lasts as long as the user is active.
const jsonwebtoken = require('jsonwebtoken');
const { sec_string, RENEW_AFTER_SECONDS, signToken, setAccessTokenCookie } = require('./jwt_auth');

function loginState(req, res, next) {
	const token = req.cookies ? req.cookies['access_token'] : undefined;
	let connected = false;
	if (token) {
		try {
			const payload = jsonwebtoken.verify(token, sec_string, { algorithms: ['HS256'] });
			connected = true;
			if (Math.floor(Date.now() / 1000) - payload.iat >= RENEW_AFTER_SECONDS) {
				const renewed = signToken(payload);
				setAccessTokenCookie(res, renewed);
				req.cookies['access_token'] = renewed;
			}
		} catch (err) {
			connected = false;
			res.clearCookie('access_token');
			delete req.cookies['access_token'];
		}
	}
	res.locals.connected = connected;
	next();
}

module.exports = loginState;
