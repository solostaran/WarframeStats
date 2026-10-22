'use strict';

// Unit tests of api/domain/rivenProcess.js, against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('./fixtures/memoryDb.js');
db.registerModels();
const RivenProcess = require('#root/api/domain/rivenProcess.js');
const { obfuscate_email } = require('#root/security/utils/obfuscation.js');

const Riven = mongoose.model('Riven');

let user, condition;
beforeAll(async () => {
	await db.connect(__filename);
	user = await db.seedUser();
	await mongoose.model('RivenType').create({ name: 'Rifle' });
	await mongoose.model('RivenType').create({ name: 'Shotgun' });
	await mongoose.model('RivenSource').create({ name: 'Sortie', more_info: 'Daily mission' });
	condition = await mongoose.model('RivenCondition').create({ description: 'Kill N enemies' });
});
afterEach(() => Riven.deleteMany({}));
afterAll(() => db.disconnect());

const form = (fields = {}) => ({ type: 'Rifle', source: 'Sortie', weaponName: 'Braton', ...fields });

describe('addOrUpdate() and byId()', () => {
	it('saves a riven and returns it populated, with its creator as a semi-obfuscated email only', async () => {
		const riven = await RivenProcess.addOrUpdate(form({ conditions: [String(condition._id)] }), user._id);
		expect(riven.type.name).toBe('Rifle');
		expect(riven.source.name).toBe('Sortie');
		expect(riven.source.more_info).toBeUndefined();	// only the name of the source
		expect(riven.conditions[0].description).toBe('Kill N enemies');
		expect(riven.toJSON().createdBy).toEqual({ email: obfuscate_email(user.email) });	// what a visitor receives
		expect(riven.modifiedBy).toBeUndefined();
	});

	it('returns the modifier of an updated riven as a semi-obfuscated email only', async () => {
		const created = await RivenProcess.addOrUpdate(form(), user._id);
		const updated = await RivenProcess.addOrUpdate(form({ _id: String(created._id), weaponName: 'Soma' }), user._id);
		expect(updated.weaponName).toBe('Soma');
		expect(updated.toJSON().modifiedBy).toEqual({ email: obfuscate_email(user.email) });
	});

	it('returns a riven without creator (saved before the creator was recorded)', async () => {
		const { insertedId } = await Riven.collection.insertOne({ weaponName: 'Old riven' });
		const riven = await RivenProcess.byId(insertedId);
		expect(riven.weaponName).toBe('Old riven');
		expect(riven.createdBy).toBeUndefined();
	});

	it('rejects an unknown or malformed riven id', async () => {
		const unknown = new mongoose.Types.ObjectId();
		await expect(RivenProcess.byId(unknown)).rejects.toBe('Cannot find riven whose ID = ' + unknown);
		await expect(RivenProcess.byId('malformed')).rejects.toBe('Cannot find riven whose ID = malformed');
	});
});

describe('list()', () => {
	it('lists the rivens populated, newest first', async () => {
		await RivenProcess.addOrUpdate(form({ weaponName: 'Old' }), user._id);
		await RivenProcess.addOrUpdate(form({ weaponName: 'New', type: 'Shotgun' }), user._id);
		const list = await RivenProcess.list();
		expect(list.map(r => r.weaponName)).toEqual(['New', 'Old']);
		expect(list[0].type.name).toBe('Shotgun');
		expect(list[0].source.name).toBe('Sortie');
	});
});

describe('deleteOneById() and deleteAll()', () => {
	it('deletes a riven and returns it', async () => {
		const created = await RivenProcess.addOrUpdate(form(), user._id);
		const deleted = await RivenProcess.deleteOneById(created._id);
		expect(deleted._id).toEqual(created._id);
		expect(await Riven.countDocuments()).toBe(0);
	});

	it('rejects an unknown riven id', async () => {
		const unknown = new mongoose.Types.ObjectId();
		await expect(RivenProcess.deleteOneById(unknown)).rejects.toBe('Cannot find riven whose ID = ' + unknown);
	});

	it('deletes every riven', async () => {
		await RivenProcess.addOrUpdate(form(), user._id);
		await RivenProcess.addOrUpdate(form(), user._id);
		expect((await RivenProcess.deleteAll()).deletedCount).toBe(2);
	});
});
