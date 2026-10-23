'use strict';

// Creates a user : the only way to add one, the API has no sign-up route.
// Usage : node resources/scripts/CreateUser.js <email>
// The password is asked twice, without echo. MONGO_URI : the database (default : the local WarframeStatsDB).
const readline = require('readline');
const { Writable } = require('stream');
const mongoose = require('mongoose');
require('#root/api/models/Users.js');

const Users = mongoose.model('Users');

// An existing email is refused : this script never replaces a password
async function createUser(email, password) {
	if (typeof email !== 'string' || !email.includes('@')) throw new Error('A valid email is required.');
	if (typeof password !== 'string' || !password) throw new Error('A password is required.');
	if (await Users.exists({ email: email })) throw new Error("User '" + email + "' already exists.");
	const user = new Users({ email: email });
	user.setPassword(password);
	return user.save();
}

// The lines are read through one buffered iterator (a pipe sends every line at once : none is lost between two questions),
// the echo is muted while a password is typed
function prompter() {
	let muted = false;
	const output = new Writable({
		write(chunk, encoding, callback) {
			if (!muted) process.stdout.write(chunk, encoding);
			callback();
		}
	});
	const rl = readline.createInterface({ input: process.stdin, output: output, terminal: process.stdin.isTTY });
	const lines = rl[Symbol.asyncIterator]();
	return {
		async hidden(question) {
			process.stdout.write(question);
			muted = true;
			try {
				const { value, done } = await lines.next();
				return done ? '' : value;	// end of the input : no password
			} finally {
				muted = false;
				process.stdout.write('\n');
			}
		},
		close: () => rl.close(),
	};
}

async function main() {
	const email = (process.argv[2] || '').trim();
	if (!email) throw new Error('Usage : node resources/scripts/CreateUser.js <email>');
	const prompt = prompter();
	let password;
	try {
		password = await prompt.hidden('Password : ');
		if (password !== await prompt.hidden('Password again : ')) throw new Error('The passwords are different.');
	} finally {
		prompt.close();
	}
	await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1/WarframeStatsDB');
	try {
		const user = await createUser(email, password);
		console.log("User '" + user.email + "' created (" + user._id + ').');
	} finally {
		await mongoose.disconnect();
	}
}

if (require.main === module) {
	main().catch(err => {
		console.error(err.message);
		process.exitCode = 1;
	});
}

module.exports = { createUser };
