'use strict';

// Migrations of the data, run at launch (app.js) before serving any request.
// The current version is stored in database (api/models/dbVersionModel.js), the target version is the last migration.
// To add a migration : write a file { version, description, up } and list it here, in order.
// A migration must be idempotent : MongoDB (standalone) has no transaction, it may run again after a crash.
// An empty database is never migrated (no version written) : the data restored later is migrated at the next launch.
const mongoose = require('mongoose');
const debug = require('debug')('warframestats:server');

const DbVersion = mongoose.model('DbVersion');

const VERSION_ID = 'schema';
const INITIAL_VERSION = 1;

const migrations = [
	require('./v2-netracell-source'),
	require('./v3-netracell-loots'),
	require('./v4-temporal-seed')
];

const EMPTY_MESSAGE = 'The database is empty and needs initialization: restore a backup, then restart the application.';

const LATEST_VERSION = migrations.length > 0 ? migrations[migrations.length - 1].version : INITIAL_VERSION;

const currentVersion = async function() {
	const doc = await DbVersion.findById(VERSION_ID).lean().exec();
	return doc ? doc.version : INITIAL_VERSION;
};

// no document in any collection, except the version : the collections created by the indexes are empty
const isEmpty = async function() {
	const db = mongoose.connection.db;
	const collections = (await db.listCollections({}, { nameOnly: true }).toArray())
		.map(c => c.name)
		.filter(name => name !== DbVersion.collection.collectionName && !name.startsWith('system.'));
	const counts = await Promise.all(collections.map(name => db.collection(name).estimatedDocumentCount()));
	return counts.every(count => count === 0);
};

const migrate = async function() {
	let version = await currentVersion();
	if (version > LATEST_VERSION)
		throw new Error('Database version '+version+' is newer than the application (version '+LATEST_VERSION+').');
	if (await isEmpty()) {
		const frame = '*'.repeat(80);
		console.warn(frame+'\n* '+EMPTY_MESSAGE+'\n* No migration (database version '+version+').\n'+frame);
		console.log("Database version : "+version);
		return version;
	}
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
	debug("Database version : "+version);
	return version;
};

exports.LATEST_VERSION = LATEST_VERSION;
exports.EMPTY_MESSAGE = EMPTY_MESSAGE;
exports.isEmpty = isEmpty;
exports.currentVersion = currentVersion;
exports.migrate = migrate;
