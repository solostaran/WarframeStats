'use strict';

// Unit tests of api/domain/rewardProcess.js, against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('./fixtures/memoryDb.js');
db.registerModels();
const RewardProcess = require('#root/api/domain/rewardProcess.js');
const { obfuscate_email } = require('#root/security/utils/obfuscation.js');

const Reward = mongoose.model('Reward');

let user, sortie, archon, endo, booster, rivenMod, credit, rifle;
beforeAll(async () => {
	await db.connect(__filename);
	user = await db.seedUser();
	sortie = await mongoose.model('RewardSource').create({ name: 'Sortie' });
	archon = await mongoose.model('RewardSource').create({ name: 'Archon Hunt' });
	await mongoose.model('RivenSource').create({ name: 'Sortie' });
	endo = await mongoose.model('RewardType').create({ name: 'Endo' });
	booster = await mongoose.model('RewardType').create({ name: 'Booster' });
	rivenMod = await mongoose.model('RewardType').create({ name: 'Riven Mod' });
	credit = await mongoose.model('BoosterType').create({ name: 'Credit Booster', description: 'x2 credits' });
	rifle = await mongoose.model('RivenType').create({ name: 'Rifle' });
});
beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
afterEach(async () => {
	jest.restoreAllMocks();
	await Promise.all([Reward.deleteMany({}), mongoose.model('Riven').deleteMany({})]);
});
afterAll(() => db.disconnect());

// rewards saved directly (dates at noon UTC, like value2date)
const insert = (fields) => Reward.create({ source: sortie._id, type: endo._id, createdBy: user._id, ...fields });
const day = date => new Date(date + 'T12:00:00.000Z');

describe('count(), countByType() and list_raw()', () => {
	beforeEach(async () => {
		await insert({ date: day('2026-01-01') });
		await insert({ date: day('2026-01-03'), type: booster._id, booster: credit._id });
		await insert({ date: day('2026-01-02'), type: rivenMod._id, rivenType: rifle._id });
	});

	it('counts every reward, and the rewards of a type', async () => {
		expect(await RewardProcess.count()).toBe(3);
		expect(await RewardProcess.countByType(booster._id)).toBe(1);
	});

	it('lists every reward populated, newest first', async () => {
		const list = await RewardProcess.list_raw();
		expect(list.map(r => r.type.name)).toEqual(['Booster', 'Riven Mod', 'Endo']);
		expect(list[0].source.name).toBe('Sortie');
		expect(list[0].booster.name).toBe('Credit Booster');
		expect(list[1].rivenType.name).toBe('Rifle');
	});
});

describe('list_paged()', () => {
	beforeEach(async () => {
		await insert({ date: day('2026-01-01') });
		await insert({ date: day('2026-01-02'), source: archon._id, type: booster._id, booster: credit._id });
		await insert({ date: day('2026-01-03'), type: rivenMod._id, rivenType: rifle._id });
		await insert({ date: day('2026-01-04') });
	});
	const page = (options) => RewardProcess.list_paged({ order: -1, offset: 0, limit: 10, ...options });
	const days = result => result.rows.map(r => r.date.toISOString().substring(0, 10));

	it('gives one page in the requested order, with the total', async () => {
		const result = await page({ offset: 1, limit: 2 });
		expect(days(result)).toEqual(['2026-01-03', '2026-01-02']);
		expect(result.total).toBe(4);
		expect(days(await page({ order: 1, limit: 1 }))).toEqual(['2026-01-01']);
	});

	it('filters by type, source, booster and riven type', async () => {
		expect((await page({ type: endo._id })).total).toBe(2);
		expect((await page({ source: archon._id })).total).toBe(1);
		expect((await page({ booster: credit._id })).total).toBe(1);
		expect((await page({ rivenType: rifle._id })).total).toBe(1);
	});

	it('filters the rewards without booster and without riven type', async () => {
		expect(days(await page({ none: true }))).toEqual(['2026-01-04', '2026-01-01']);
	});

	it('filters by UTC days, both included', async () => {
		expect(days(await page({ dateLow: '2026-01-02', dateHigh: '2026-01-03' }))).toEqual(['2026-01-03', '2026-01-02']);
		expect((await page({ dateLow: '2026-01-04' })).total).toBe(1);
		expect((await page({ dateHigh: '2026-01-01' })).total).toBe(1);
	});

	it('populates the references', async () => {
		const [reward] = (await page({ booster: credit._id })).rows;
		expect(reward.source.name).toBe('Archon Hunt');
		expect(reward.type.name).toBe('Booster');
		expect(reward.booster.name).toBe('Credit Booster');
	});
});

describe('addOrUpdate() and adds()', () => {
	it('saves a reward from a form', async () => {
		const reward = await RewardProcess.addOrUpdate({ source: 'Sortie', type: 'Endo', date: '2026-01-01' }, user._id);
		expect(reward.type).toEqual(endo._id);
	});

	it('rejects a null object', async () => {
		await expect(RewardProcess.addOrUpdate(null, user._id)).rejects.toBe('Null object');
	});

	it('saves several rewards and counts the inserted and rejected ones', async () => {
		const forms = [{ source: 'Sortie', type: 'Endo', date: '2026-01-01' }, { source: 'Sortie', type: 'Endo' }, null];
		const result = await new Promise((resolve, reject) => RewardProcess.adds(forms, user._id, resolve, reject));
		expect(result.insertedCount).toBe(1);
		expect(result.rejectedCount).toBe(2);
		expect(result.rejects.map(r => r.reject)).toEqual([null, forms[1]]);
		expect(await Reward.countDocuments()).toBe(1);
	});

	it('calls onError when onSuccess fails', async () => {
		const error = await new Promise(resolve => RewardProcess.adds([], user._id, () => { throw new Error('onSuccess failed'); }, resolve));
		expect(error.message).toBe('onSuccess failed');
	});
});

describe('findById()', () => {
	it('returns the reward populated, with its creator and modifier as a semi-obfuscated email only', async () => {
		const created = await insert({ date: day('2026-01-01'), type: booster._id, booster: credit._id, modifiedBy: user._id });
		const reward = await RewardProcess.findById(created._id);
		expect(reward.type.name).toBe('Booster');
		expect(reward.booster.name).toBe('Credit Booster');
		const json = reward.toJSON();	// what a visitor receives
		expect(json.createdBy).toEqual({ email: obfuscate_email(user.email) });
		expect(json.modifiedBy).toEqual({ email: obfuscate_email(user.email) });
	});

	it('returns the riven of the reward, populated', async () => {
		const created = await RewardProcess.addOrUpdate({ source: 'Sortie', type: 'Riven Mod', date: '2026-01-01', rivenType: 'Rifle', rivenWeaponName: 'Braton' }, user._id);
		const reward = await RewardProcess.findById(created._id);
		expect(reward.riven.weaponName).toBe('Braton');
		expect(reward.riven.type.name).toBe('Rifle');
	});

	it('returns null for an unknown id', async () => {
		expect(await RewardProcess.findById(new mongoose.Types.ObjectId())).toBeNull();
	});

	it('returns a reward without creator', async () => {
		const created = await Reward.create({ source: sortie._id, type: endo._id });
		expect((await RewardProcess.findById(created._id)).createdBy).toBeUndefined();
	});
});

describe('deleteOneById() and deleteAll()', () => {
	it('deletes a reward and returns it', async () => {
		const created = await insert({ date: day('2026-01-01') });
		expect((await RewardProcess.deleteOneById(created._id))._id).toEqual(created._id);
		expect(await Reward.countDocuments()).toBe(0);
	});

	it('rejects an unknown reward id', async () => {
		const unknown = new mongoose.Types.ObjectId();
		await expect(RewardProcess.deleteOneById(unknown)).rejects.toBe('Cannot find reward whose ID = ' + unknown);
	});

	it('deletes every reward', async () => {
		await insert({ date: day('2026-01-01') });
		await insert({ date: day('2026-01-02') });
		expect((await RewardProcess.deleteAll()).deletedCount).toBe(2);
	});
});
