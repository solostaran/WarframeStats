'use strict';

// Integration test of resources/scripts/CreateUser.js (createUser, without the prompts),
// against the in-memory MongoDB of the run (tests/fixtures/memoryDb.js).

const mongoose = require('mongoose');
const db = require('#root/tests/fixtures/memoryDb.js');
const { createUser } = require('#root/resources/scripts/CreateUser.js');

const Users = mongoose.model('Users');

describe('createUser()', () => {
	beforeAll(() => db.connect(__filename));
	afterEach(() => db.clear());
	afterAll(() => db.disconnect());

	it('creates a user whose password is hashed', async () => {
		const created = await createUser('tester@example.com', 'secret');
		const saved = await Users.findById(created._id);
		expect(saved.email).toBe('tester@example.com');
		expect(saved.hash).not.toContain('secret');
		expect(saved.validatePassword('secret')).toBe(true);
		expect(saved.validatePassword('wrong')).toBe(false);
	});

	it('refuses an existing email and keeps its password', async () => {
		await createUser('tester@example.com', 'secret');
		await expect(createUser('tester@example.com', 'other')).rejects.toThrow("User 'tester@example.com' already exists.");
		const users = await Users.find();
		expect(users).toHaveLength(1);
		expect(users[0].validatePassword('secret')).toBe(true);
	});

	it('requires a valid email and a password', async () => {
		await expect(createUser('', 'secret')).rejects.toThrow('A valid email is required.');
		await expect(createUser('not an email', 'secret')).rejects.toThrow('A valid email is required.');
		await expect(createUser('tester@example.com', '')).rejects.toThrow('A password is required.');
		expect(await Users.countDocuments()).toBe(0);
	});
});
