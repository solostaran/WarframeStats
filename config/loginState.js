'use strict';

// Per request login state for the PUG templates (res.locals.connected).
// The "access_token" cookie is verified the same way as config/jwt_auth.js does,
// but an invalid or expired token never raises an error : the visitor is simply not connected.
const jsonwebtoken = require('jsonwebtoken');
const { sec_string } = require('./jwt_auth');

function loginState(req, res, next) {
	const token = req.cookies ? req.cookies['access_token'] : undefined;
	let connected = false;
	if (token) {
		try {
			jsonwebtoken.verify(token, sec_string, { algorithms: ['HS256'] });
			connected = true;
		} catch (err) {
			connected = false;
		}
	}
	res.locals.connected = connected;
	next();
}

module.exports = loginState;
