'use strict';

// Unit tests of api/domain/rivenTypeProcess.js, against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('./fixtures/memoryDb.js');
db.registerModels();
const RivenTypeProcess = require('#root/api/domain/rivenTypeProcess.js');

const RivenType = mongoose.model('RivenType');

beforeAll(() => db.connect(__filename));
afterEach(() => db.clear());
afterAll(() => db.disconnect());

describe('add(), adds() and list()', () => {
	it('adds a riven type and lists it', async () => {
		await RivenTypeProcess.add({ name: 'Rifle' });
		expect((await RivenTypeProcess.list()).map(t => t.name)).toEqual(['Rifle']);
	});

	it('rejects a riven type without name', async () => {
		await expect(RivenTypeProcess.add({})).rejects.toThrow('Name is required');
	});

	it('inserts several riven types at once', async () => {
		const result = await RivenTypeProcess.adds([{ name: 'Rifle' }, { name: 'Shotgun' }, { name: 'Melee' }]);
		expect(result.insertedCount).toBe(3);
	});
});

describe('update()', () => {
	it('updates the name', async () => {
		const added = await RivenTypeProcess.add({ name: 'Rifle' });
		await RivenTypeProcess.update({ _id: added._id, name: 'Primary' });
		expect((await RivenTypeProcess.findById(added._id)).name).toBe('Primary');
	});
});

describe('findByIdOrName()', () => {
	let pistol;
	beforeEach(async () => {
		pistol = await RivenTypeProcess.add({ name: 'Pistol' });
		await RivenTypeProcess.add({ name: 'Archgun' });
		await RivenTypeProcess.add({ name: 'Archmelee' });
	});

	it('finds by id, as a string or an ObjectId', async () => {
		expect((await RivenTypeProcess.findByIdOrName(String(pistol._id))).name).toBe('Pistol');
		expect((await RivenTypeProcess.findByIdOrName(pistol._id)).name).toBe('Pistol');
	});

	it('finds by a unique name, case insensitive', async () => {
		expect((await RivenTypeProcess.findByIdOrName('pistol')).name).toBe('Pistol');
	});

	it('returns null for an ambiguous or unknown name', async () => {
		expect(await RivenTypeProcess.findByIdOrName('Arch')).toBeNull();
		expect(await RivenTypeProcess.findByIdOrName('Kitgun')).toBeNull();
	});

	it('returns null for an unknown id', async () => {
		expect(await RivenTypeProcess.findByIdOrName(String(new mongoose.Types.ObjectId()))).toBeNull();
	});

	it('returns null for a parameter that is neither a string nor an ObjectId', async () => {
		expect(await RivenTypeProcess.findByIdOrName({ $ne: null })).toBeNull();
	});
});

describe('deleteOneById() and deleteAll()', () => {
	it('deletes one riven type, then every riven type', async () => {
		const added = await RivenTypeProcess.add({ name: 'Rifle' });
		await RivenTypeProcess.add({ name: 'Shotgun' });
		expect((await RivenTypeProcess.deleteOneById(added._id)).deletedCount).toBe(1);
		expect((await RivenTypeProcess.deleteAll()).deletedCount).toBe(1);
		expect(await RivenType.countDocuments()).toBe(0);
	});
});
