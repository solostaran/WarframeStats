'use strict';

// Rebuild req.body without the keys that could be used for a NoSQL operator injection
// (e.g. "type[$ne]=x" or {"type": {"$ne": null}}) or a prototype pollution.
const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function clean(value) {
	if (Array.isArray(value))
		return value.map(clean);
	if (value !== null && typeof value === 'object') {
		const result = {};
		for (const [key, val] of Object.entries(value)) {
			if (key.startsWith('$') || FORBIDDEN_KEYS.has(key)) continue;
			result[key] = clean(val);
		}
		return result;
	}
	return value;
}

function sanitizeBody(req, _res, next) {
	if (req.body !== null && typeof req.body === 'object')
		req.body = clean(req.body);
	next();
}

module.exports = sanitizeBody;
module.exports.clean = clean;
