'use strict';

// Unit tests of api/domain/rewardTypeProcess.js, against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('./fixtures/memoryDb.js');
db.registerModels();
const RewardTypeProcess = require('#root/api/domain/rewardTypeProcess.js');

const RewardType = mongoose.model('RewardType');

beforeAll(() => db.connect(__filename));
afterEach(() => db.clear());
afterAll(() => db.disconnect());

describe('add(), adds() and list()', () => {
	it('adds a reward type and lists it', async () => {
		await RewardTypeProcess.add({ name: 'Riven Mod' });
		const list = await RewardTypeProcess.list();
		expect(list.map(t => t.name)).toEqual(['Riven Mod']);
	});

	it('rejects a reward type without name', async () => {
		await expect(RewardTypeProcess.add({})).rejects.toThrow(/name/);
	});

	it('inserts several reward types at once', async () => {
		const result = await RewardTypeProcess.adds([{ name: 'Riven Mod' }, { name: 'Booster' }]);
		expect(result.insertedCount).toBe(2);
	});
});

describe('update()', () => {
	it('updates the name', async () => {
		const added = await RewardTypeProcess.add({ name: 'Exilus' });
		await RewardTypeProcess.update({ _id: added._id, name: 'Warframe Exilus Adapter' });
		expect((await RewardTypeProcess.findById(added._id)).name).toBe('Warframe Exilus Adapter');
	});
});

describe('findByName()', () => {
	it('matches a part of the name, case insensitive and literally', async () => {
		await RewardTypeProcess.add({ name: 'Endo (3000)' });
		expect(await RewardTypeProcess.findByName('endo (3000)')).toHaveLength(1);
		expect(await RewardTypeProcess.findByName('.+')).toHaveLength(0);
	});
});

describe('findByIdOrName()', () => {
	let riven;
	beforeEach(async () => {
		riven = await RewardTypeProcess.add({ name: 'Riven Mod' });
		await RewardTypeProcess.add({ name: 'Riven Sliver' });
	});

	it('finds by id, as a string or an ObjectId', async () => {
		expect((await RewardTypeProcess.findByIdOrName(String(riven._id))).name).toBe('Riven Mod');
		expect((await RewardTypeProcess.findByIdOrName(riven._id)).name).toBe('Riven Mod');
	});

	it('returns the first match of an ambiguous name (unlike the other type processes)', async () => {
		expect((await RewardTypeProcess.findByIdOrName('Riven')).name).toMatch(/^Riven/);
	});

	it('returns null for an unknown id', async () => {
		expect(await RewardTypeProcess.findByIdOrName(String(new mongoose.Types.ObjectId()))).toBeNull();
	});

	it('throws for an unknown name', async () => {
		await expect(RewardTypeProcess.findByIdOrName('Unknown')).rejects.toThrow(/does not exists/);
	});

	it('throws for a parameter that is neither a string nor an ObjectId', async () => {
		await expect(RewardTypeProcess.findByIdOrName(undefined)).rejects.toThrow(/does not exists/);
	});
});

describe('deleteOneById() and deleteAll()', () => {
	it('deletes one reward type, then every reward type', async () => {
		const added = await RewardTypeProcess.add({ name: 'Riven Mod' });
		await RewardTypeProcess.add({ name: 'Booster' });
		await RewardTypeProcess.add({ name: 'Endo' });
		expect((await RewardTypeProcess.deleteOneById(added._id)).deletedCount).toBe(1);
		expect((await RewardTypeProcess.deleteAll()).deletedCount).toBe(2);
		expect(await RewardType.countDocuments()).toBe(0);
	});
});
