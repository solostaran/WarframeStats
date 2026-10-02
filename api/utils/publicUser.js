'use strict';

const { obfuscate_email } = require('./obfuscate');

// What may be shown about the creator/modifier of a record : a semi-obfuscated email only.
// Never the user document itself, its _id or a token (see Users.toAuthJSON, for the user's own login only).
function publicUser(user) {
	if (!user || typeof user.email !== 'string') return undefined;
	return { email: obfuscate_email(user.email) };
}

module.exports = publicUser;
