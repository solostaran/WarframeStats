'use strict';

const email_regex = /(^.{2})(.*)(.{2}$)/gy
function obfuscate_email(email) {
	return email.replace(
		email_regex,
		(_, $1, $2, $3) => `${$1}${'*'.repeat($2.length)}${$3}`);
}

exports.obfuscate_email = obfuscate_email;
