'use strict';

// In-memory database of the domain unit tests : one database per test file,
// on the MongoDB server started once for the whole run (tests/globalSetup.js).
const path = require('path');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// Mongoose models, in the same order as app.js : a domain module gets its models when it is required
function registerModels() {
	require('#root/api/models/rivenTypeModel.js');
	require('#root/api/models/rivenSourceModel.js');
	require('#root/api/models/rivenConditionModel.js');
	require('#root/api/models/rivenModel.js');
	require('#root/api/models/boosterTypeModel.js');
	require('#root/api/models/rewardTypeModel.js');
	require('#root/api/models/rewardSourceModel.js');
	require('#root/api/models/rewardModel.js');
	require('#root/api/models/Users.js');
	require('#root/api/models/netracellModel.js');
	require('#root/api/models/temporalModel.js');
	require('#root/database/dbVersionModel.js');
}

// own server, when the global setup did not run (e.g. a single test file run by an IDE)
let ownServer;
// same timeout as the jest config of package.json, for a runner that ignores it (starting a server takes a few seconds)
jest.setTimeout(30000);

// testFile : __filename of the test file, its name is the name of the database
async function connect(testFile) {
	let uri = process.env.MONGO_MEMORY_URI;
	if (!uri) {
		ownServer = await MongoMemoryServer.create();
		uri = ownServer.getUri();
	}
	await mongoose.connect(uri, { dbName: path.basename(testFile, '.test.js') });
}

// empties every collection (between two tests)
function clear() {
	return Promise.all(Object.values(mongoose.connection.collections).map(collection => collection.deleteMany({})));
}

async function disconnect() {
	await mongoose.connection.dropDatabase();
	await mongoose.disconnect();
	if (ownServer) await ownServer.stop();
}

// a user, for the createdBy / modifiedBy fields (shown to visitors as a semi-obfuscated email only)
function seedUser(email = 'tester@example.com') {
	return mongoose.model('Users').create({ email: email });
}

module.exports = { registerModels, connect, clear, disconnect, seedUser };
