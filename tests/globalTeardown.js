'use strict';

// Stops the in-memory MongoDB server of tests/globalSetup.js
module.exports = async function() {
	await globalThis.__MONGOD__.stop();
};
