'use strict';

// Unit tests of api/domain/rewardSourceProcess.js, against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('#root/tests/fixtures/memoryDb.js');
db.registerModels();
const RewardSourceProcess = require('#root/api/domain/rewardSourceProcess.js');

const RewardSource = mongoose.model('RewardSource');

beforeAll(() => db.connect(__filename));
afterEach(() => db.clear());
afterAll(() => db.disconnect());

describe('addOrUpdate()', () => {
	it('creates a reward source', async () => {
		const created = await RewardSourceProcess.addOrUpdate({ name: 'Sortie' });
		expect((await RewardSourceProcess.list()).map(s => s.name)).toEqual(['Sortie']);
		expect(created._id).toBeDefined();
	});

	it('updates the name of an existing reward source', async () => {
		const created = await RewardSourceProcess.addOrUpdate({ name: 'Sortie' });
		await RewardSourceProcess.addOrUpdate({ _id: created._id, name: 'Archon Hunt' });
		expect((await RewardSourceProcess.findById(created._id)).name).toBe('Archon Hunt');
		expect(await RewardSource.countDocuments()).toBe(1);
	});

	it('rejects a null object', async () => {
		await expect(RewardSourceProcess.addOrUpdate(null)).rejects.toBe('Null object');
	});

	it('rejects a reward source without name', async () => {
		await expect(RewardSourceProcess.addOrUpdate({})).rejects.toThrow(/name/);
	});
});

describe('adds()', () => {
	it('inserts several reward sources at once', async () => {
		const result = await RewardSourceProcess.adds([{ name: 'Sortie' }, { name: 'Archon Hunt' }]);
		expect(result.insertedCount).toBe(2);
	});
});

describe('findByIdOrName()', () => {
	let sortie;
	beforeEach(async () => {
		sortie = await RewardSourceProcess.addOrUpdate({ name: 'Sortie' });
		await RewardSourceProcess.addOrUpdate({ name: 'Steel Path Sortie' });
		await RewardSourceProcess.addOrUpdate({ name: 'Archon Hunt' });
	});

	it('finds by id, as a string or an ObjectId', async () => {
		expect((await RewardSourceProcess.findByIdOrName(String(sortie._id))).name).toBe('Sortie');
		expect((await RewardSourceProcess.findByIdOrName(sortie._id)).name).toBe('Sortie');
	});

	it('finds by a unique name, case insensitive', async () => {
		expect((await RewardSourceProcess.findByIdOrName('archon')).name).toBe('Archon Hunt');
	});

	it('returns null for an ambiguous or unknown name', async () => {
		expect(await RewardSourceProcess.findByIdOrName('Sortie')).toBeNull();
		expect(await RewardSourceProcess.findByIdOrName('Invasion')).toBeNull();
	});

	it('returns null for an unknown id or a parameter that is not a string', async () => {
		expect(await RewardSourceProcess.findByIdOrName(String(new mongoose.Types.ObjectId()))).toBeNull();
		expect(await RewardSourceProcess.findByIdOrName(12)).toBeNull();
	});
});

describe('deleteOneById() and deleteAll()', () => {
	it('deletes one reward source, then every reward source', async () => {
		const created = await RewardSourceProcess.addOrUpdate({ name: 'Sortie' });
		await RewardSourceProcess.addOrUpdate({ name: 'Archon Hunt' });
		expect((await RewardSourceProcess.deleteOneById(created._id)).deletedCount).toBe(1);
		expect((await RewardSourceProcess.deleteAll()).deletedCount).toBe(1);
	});
});
