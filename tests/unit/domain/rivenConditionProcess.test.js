'use strict';

// Unit tests of api/domain/rivenConditionProcess.js, against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('#root/tests/fixtures/memoryDb.js');
db.registerModels();
const RivenConditionProcess = require('#root/api/domain/rivenConditionProcess.js');

const RivenCondition = mongoose.model('RivenCondition');

let user;
beforeAll(async () => {
	await db.connect(__filename);
	user = await db.seedUser();
});
afterEach(() => RivenCondition.deleteMany({}));
afterAll(() => db.disconnect());

describe('addOrUpdate()', () => {
	it('creates a mandatory condition, with its advices and its creator', async () => {
		const created = await RivenConditionProcess.addOrUpdate({ description: 'Kill 10 enemies', advices: ['Use a shotgun'] }, user._id);
		expect(created.description).toBe('Kill 10 enemies');
		expect(created.optional).toBeUndefined();
		expect(created.advices).toEqual(['Use a shotgun']);
		expect(created.createdBy).toEqual(user._id);
	});

	it('creates an optional condition from the "on" or "true" form values', async () => {
		expect((await RivenConditionProcess.addOrUpdate({ description: 'A', optional: 'on' }, user._id)).optional).toBe(true);
		expect((await RivenConditionProcess.addOrUpdate({ description: 'B', optional: 'true' }, user._id)).optional).toBe(true);
		expect((await RivenConditionProcess.addOrUpdate({ description: 'C', optional: 'off' }, user._id)).optional).toBeUndefined();
	});

	it('updates an existing condition and its modifier, and makes it mandatory again', async () => {
		const created = await RivenConditionProcess.addOrUpdate({ description: 'A', optional: 'on' }, user._id);
		const updated = await RivenConditionProcess.addOrUpdate({ _id: created._id, description: 'B' }, user._id);
		expect(updated.description).toBe('B');
		expect(updated.optional).toBeUndefined();
		expect(updated.modifiedBy).toEqual(user._id);
		expect(await RivenCondition.countDocuments()).toBe(1);
	});

	it('rejects a null object', async () => {
		await expect(RivenConditionProcess.addOrUpdate(null, user._id)).rejects.toBe('Null object');
	});

	it('rejects a condition without description', async () => {
		await expect(RivenConditionProcess.addOrUpdate({}, user._id)).rejects.toThrow(/description/);
	});
});

describe('list() and formattedList()', () => {
	beforeEach(async () => {
		await RivenConditionProcess.addOrUpdate({ description: 'Optional', optional: 'on' }, user._id);
		await RivenConditionProcess.addOrUpdate({ description: 'Mandatory' }, user._id);
	});

	it('lists the mandatory conditions first', async () => {
		expect((await RivenConditionProcess.list()).map(c => c.description)).toEqual(['Mandatory', 'Optional']);
	});

	it('splits the mandatory and the optional conditions', async () => {
		const { mandatories, optionals } = await RivenConditionProcess.formattedList();
		expect(mandatories.map(c => c.description)).toEqual(['Mandatory']);
		expect(optionals.map(c => c.description)).toEqual(['Optional']);
	});
});

describe('adds()', () => {
	it('bulk insert conditions', async () => {
		const result = await RivenConditionProcess.adds([{ description: 'A' }, { description: 'B', optional: 'on' }], user._id);
		expect(result).toMatchObject({ insertedCount: 2, rejectedCount: 0 });
		expect(await RivenCondition.countDocuments()).toBe(2);
		expect((await RivenConditionProcess.formattedList()).optionals).toHaveLength(1);
	});

	it('returns the insertion counts', async () => {
		const result = await RivenConditionProcess.adds([{ description: 'A' }, {}], user._id);
		expect(result).toMatchObject({ insertedCount: 1, rejectedCount: 1 });
		expect(await RivenCondition.countDocuments()).toBe(1);
	});
});

describe('byId(), deleteOneById() and deleteAll()', () => {
	it('finds, deletes one, then deletes every condition', async () => {
		const created = await RivenConditionProcess.addOrUpdate({ description: 'A' }, user._id);
		await RivenConditionProcess.addOrUpdate({ description: 'B' }, user._id);
		expect((await RivenConditionProcess.byId(created._id)).description).toBe('A');
		expect((await RivenConditionProcess.deleteOneById(created._id)).deletedCount).toBe(1);
		expect(await RivenConditionProcess.byId(created._id)).toBeNull();
		expect((await RivenConditionProcess.deleteAll()).deletedCount).toBe(1);
	});
});
