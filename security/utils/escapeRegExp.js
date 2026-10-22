'use strict';

// Escape the regular expression special characters of a user provided value,
// so that it is matched literally (e.g. in a "$regex" query).
function escapeRegExp(value) {
	return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = escapeRegExp;
