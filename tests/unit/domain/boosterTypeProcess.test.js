'use strict';

// Unit tests of api/domain/boosterTypeProcess.js, against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('./fixtures/memoryDb.js');
db.registerModels();
const BoosterTypeProcess = require('#root/api/domain/boosterTypeProcess.js');

const BoosterType = mongoose.model('BoosterType');

beforeAll(() => db.connect(__filename));
afterEach(() => db.clear());
afterAll(() => db.disconnect());

const affinity = { name: 'Affinity Booster', description: 'Doubles the affinity' };
const credit = { name: 'Credit Booster', description: 'Doubles the credits' };

describe('add() and list()', () => {
	it('adds a booster type and lists it', async () => {
		const added = await BoosterTypeProcess.add(affinity);
		const list = await BoosterTypeProcess.list();
		expect(list).toHaveLength(1);
		expect(list[0]._id).toEqual(added._id);
		expect(list[0].name).toBe('Affinity Booster');
	});

	it('rejects a booster type without description', async () => {
		await expect(BoosterTypeProcess.add({ name: 'No description' })).rejects.toThrow(/description/);
	});
});

describe('adds()', () => {
	it('inserts several booster types at once', async () => {
		const result = await BoosterTypeProcess.adds([{ ...affinity }, { ...credit }]);
		expect(result.insertedCount).toBe(2);
		expect(await BoosterType.countDocuments()).toBe(2);
	});
});

describe('to_array()', () => {
	it('maps each booster type id to its name', async () => {
		const a = await BoosterTypeProcess.add(affinity);
		const c = await BoosterTypeProcess.add(credit);
		const array = await BoosterTypeProcess.to_array();
		expect(array[a._id]).toBe('Affinity Booster');
		expect(array[c._id]).toBe('Credit Booster');
	});
});

describe('update()', () => {
	it('updates the name, the description and the url', async () => {
		const added = await BoosterTypeProcess.add(affinity);
		await BoosterTypeProcess.update({ _id: added._id, name: 'Affinity', description: 'x2', url: 'https://example.com' });
		const updated = await BoosterTypeProcess.findById(added._id);
		expect(updated.name).toBe('Affinity');
		expect(updated.description).toBe('x2');
		expect(updated.url).toBe('https://example.com');
	});
});

describe('findByName()', () => {
	it('matches a part of the name, case insensitive', async () => {
		await BoosterTypeProcess.add(affinity);
		const found = await BoosterTypeProcess.findByName('affinity');
		expect(found).toHaveLength(1);
	});

	it('matches the regular expression characters literally', async () => {
		await BoosterTypeProcess.add({ name: 'Resource (x2)', description: 'x' });
		expect(await BoosterTypeProcess.findByName('(x2)')).toHaveLength(1);
		expect(await BoosterTypeProcess.findByName('.*')).toHaveLength(0);
	});
});

describe('findByIdOrName()', () => {
	let added;
	beforeEach(async () => {
		added = await BoosterTypeProcess.add(affinity);
		await BoosterTypeProcess.add(credit);
	});

	it('finds by id, as a string or an ObjectId', async () => {
		expect((await BoosterTypeProcess.findByIdOrName(String(added._id))).name).toBe('Affinity Booster');
		expect((await BoosterTypeProcess.findByIdOrName(added._id)).name).toBe('Affinity Booster');
	});

	it('finds by a unique name', async () => {
		expect((await BoosterTypeProcess.findByIdOrName('credit')).name).toBe('Credit Booster');
	});

	it('returns null for an unknown id', async () => {
		expect(await BoosterTypeProcess.findByIdOrName(String(new mongoose.Types.ObjectId()))).toBeNull();
	});

	it('throws for an ambiguous name', async () => {
		await expect(BoosterTypeProcess.findByIdOrName('Booster')).rejects.toThrow(/imprecise/);
	});

	it('throws for an unknown name', async () => {
		await expect(BoosterTypeProcess.findByIdOrName('Unknown')).rejects.toThrow(/imprecise/);
	});

	it('throws for a parameter that is neither a string nor an ObjectId', async () => {
		await expect(BoosterTypeProcess.findByIdOrName(42)).rejects.toThrow(/does not exists/);
	});
});

describe('deleteOneById() and deleteAll()', () => {
	it('deletes one booster type', async () => {
		const added = await BoosterTypeProcess.add(affinity);
		await BoosterTypeProcess.add(credit);
		expect((await BoosterTypeProcess.deleteOneById(added._id)).deletedCount).toBe(1);
		expect(await BoosterType.countDocuments()).toBe(1);
	});

	it('deletes every booster type', async () => {
		await BoosterTypeProcess.adds([{ ...affinity }, { ...credit }]);
		expect((await BoosterTypeProcess.deleteAll()).deletedCount).toBe(2);
	});
});
