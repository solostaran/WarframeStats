'use strict';

// One in-memory MongoDB server for the whole Jest run, shared by the unit and integration tests
// (tests/fixtures/memoryDb.js : one database per test file).
// The workers inherit process.env.MONGO_MEMORY_URI ; tests/globalTeardown.js stops the server.
const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = async function() {
	const mongod = await MongoMemoryServer.create();
	globalThis.__MONGOD__ = mongod;
	process.env.MONGO_MEMORY_URI = mongod.getUri();
};
