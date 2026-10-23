'use strict';

// Unit tests of api/domain/rivenSourceProcess.js, against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('#root/tests/fixtures/memoryDb.js');
db.registerModels();
const RivenSourceProcess = require('#root/api/domain/rivenSourceProcess.js');

const RivenSource = mongoose.model('RivenSource');

beforeAll(() => db.connect(__filename));
afterEach(() => db.clear());
afterAll(() => db.disconnect());

describe('addOrUpdate()', () => {
	it('creates a riven source with more information', async () => {
		const created = await RivenSourceProcess.addOrUpdate({ name: 'Sortie', more_info: 'Daily mission' });
		const found = await RivenSourceProcess.findById(created._id);
		expect(found.name).toBe('Sortie');
		expect(found.more_info).toBe('Daily mission');
	});

	it('creates a riven source without more information', async () => {
		const created = await RivenSourceProcess.addOrUpdate({ name: 'Kuva Lich' });
		expect((await RivenSourceProcess.findById(created._id)).more_info).toBeUndefined();
	});

	it('updates an existing riven source, keeping its more information when none is given', async () => {
		const created = await RivenSourceProcess.addOrUpdate({ name: 'Sortie', more_info: 'Daily mission' });
		await RivenSourceProcess.addOrUpdate({ _id: created._id, name: 'Steel Path Sortie' });
		const found = await RivenSourceProcess.findById(created._id);
		expect(found.name).toBe('Steel Path Sortie');
		expect(found.more_info).toBe('Daily mission');
		expect(await RivenSource.countDocuments()).toBe(1);
	});

	it('rejects a null object', async () => {
		await expect(RivenSourceProcess.addOrUpdate(null)).rejects.toBe('Null object');
	});
});

describe('adds()', () => {
	it('inserts several riven sources at once', async () => {
		const result = await RivenSourceProcess.adds([{ name: 'Sortie' }, { name: 'Kuva Lich' }]);
		expect(result.insertedCount).toBe(2);
		expect((await RivenSourceProcess.list())).toHaveLength(2);
	});
});

describe('findByIdOrName()', () => {
	let sortie;
	beforeEach(async () => {
		sortie = await RivenSourceProcess.addOrUpdate({ name: 'Sortie' });
		await RivenSourceProcess.addOrUpdate({ name: 'Steel Path Sortie' });
		await RivenSourceProcess.addOrUpdate({ name: 'Kuva Lich' });
	});

	it('finds by id, as a string or an ObjectId', async () => {
		expect((await RivenSourceProcess.findByIdOrName(String(sortie._id))).name).toBe('Sortie');
		expect((await RivenSourceProcess.findByIdOrName(sortie._id)).name).toBe('Sortie');
	});

	it('finds by a unique name, case insensitive', async () => {
		expect((await RivenSourceProcess.findByIdOrName('kuva')).name).toBe('Kuva Lich');
	});

	it('returns null for an ambiguous or unknown name, an unknown id or a parameter that is not a string', async () => {
		expect(await RivenSourceProcess.findByIdOrName('Sortie')).toBeNull();
		expect(await RivenSourceProcess.findByIdOrName('Invasion')).toBeNull();
		expect(await RivenSourceProcess.findByIdOrName(String(new mongoose.Types.ObjectId()))).toBeNull();
		expect(await RivenSourceProcess.findByIdOrName(null)).toBeNull();
	});
});

describe('deleteOneById() and deleteAll()', () => {
	it('deletes one riven source, then every riven source', async () => {
		const created = await RivenSourceProcess.addOrUpdate({ name: 'Sortie' });
		await RivenSourceProcess.addOrUpdate({ name: 'Kuva Lich' });
		expect((await RivenSourceProcess.deleteOneById(created._id)).deletedCount).toBe(1);
		expect((await RivenSourceProcess.deleteAll()).deletedCount).toBe(1);
	});
});
