'use strict';

const email_regex = /(^.{3})(.*)(.{3}$)/gy
const id_regex = /(^.{4})(.*)(.{4}$)/gy
function obfuscate_email(email) {
	return email.replace(
		email_regex,
		(_, $1, $2, $3) => `${$1}${'*'.repeat($2.length)}${$3}`);
}

function obfuscate_id(id) {
	return id.toString().replace(
		id_regex,
		(_,$1,$2,$3) => `${$1}${'*'.repeat($2.length)}${$3}`);
}

exports.obfuscate_email = obfuscate_email;
exports.obfuscate_id = obfuscate_id;
