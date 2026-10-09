'use strict';

// Migrations of the data, run at launch (app.js) before serving any request.
// The current version is stored in database (api/models/dbVersionModel.js), the target version is the last migration.
// To add a migration : write a file { version, description, up } and list it here, in order.
// A migration must be idempotent : MongoDB (standalone) has no transaction, it may run again after a crash.
const mongoose = require('mongoose');

const DbVersion = mongoose.model('DbVersion');

const VERSION_ID = 'schema';
const INITIAL_VERSION = 1;

const migrations = [
	require('./v2-netracell-source')
];

const LATEST_VERSION = migrations.length > 0 ? migrations[migrations.length - 1].version : INITIAL_VERSION;

const currentVersion = async function() {
	const doc = await DbVersion.findById(VERSION_ID).lean().exec();
	return doc ? doc.version : INITIAL_VERSION;
};

const migrate = async function() {
	let version = await currentVersion();
	if (version > LATEST_VERSION)
		throw new Error('Database version '+version+' is newer than the application (version '+LATEST_VERSION+').');
	for (const migration of migrations.filter(m => m.version > version)) {
		console.log("Database migration "+version+" -> "+migration.version+" : "+migration.description);
		await migration.up();
		await DbVersion.updateOne(
			{ _id: VERSION_ID },
			{ $set: { version: migration.version, migratedAt: new Date() } },
			{ upsert: true }
		).exec();
		version = migration.version;
	}
	console.log("Database version : "+version);
	return version;
};

exports.LATEST_VERSION = LATEST_VERSION;
exports.currentVersion = currentVersion;
exports.migrate = migrate;
