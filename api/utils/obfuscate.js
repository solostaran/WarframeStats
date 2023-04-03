'use strict';

//const email_regex = /(^.{1,2})(.*)(\..*$)/gy
//const email_regex = /[^@]/gy
const email_regex = /(^.{2})(.*)(.{2}$)/gy
function obfuscate_email(email) {
	//return email.replace(email_regex, function (_, $0, $1, $2) { return $0 + '*'.repeat($1.length) + $2 });
	//return email.replace(email_regex, '*');
	return email.replace(email_regex, (_, $1, $2, $3) => `${$1}${'*'.repeat($2.length)}${$3}`);
}

exports.obfuscate_email = obfuscate_email;
