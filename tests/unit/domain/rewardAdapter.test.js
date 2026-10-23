'use strict';

// Unit tests of api/domain/rewardAdapter.js (reward form -> saved reward, and its riven), against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('#root/tests/fixtures/memoryDb.js');
db.registerModels();
const RewardAdapter = require('#root/api/domain/rewardAdapter.js');

const Reward = mongoose.model('Reward');
const Riven = mongoose.model('Riven');

let user, sortie, endo, booster, rivenMod, affinity, credit, rifle, condition;
beforeAll(async () => {
	await db.connect(__filename);
	user = await db.seedUser();
	sortie = await mongoose.model('RewardSource').create({ name: 'Sortie' });
	await mongoose.model('RewardSource').create({ name: 'Archon Hunt' });
	await mongoose.model('RivenSource').create({ name: 'Sortie' });	// the riven source of a reward has the name of its reward source
	endo = await mongoose.model('RewardType').create({ name: 'Endo' });
	booster = await mongoose.model('RewardType').create({ name: 'Booster' });
	rivenMod = await mongoose.model('RewardType').create({ name: 'Riven Mod' });
	affinity = await mongoose.model('BoosterType').create({ name: 'Affinity Booster', description: 'x2 affinity' });
	credit = await mongoose.model('BoosterType').create({ name: 'Credit Booster', description: 'x2 credits' });
	rifle = await mongoose.model('RivenType').create({ name: 'Rifle' });
	condition = await mongoose.model('RivenCondition').create({ description: 'Kill N enemies' });
});
afterEach(() => Promise.all([Reward.deleteMany({}), Riven.deleteMany({})]));
afterAll(() => db.disconnect());

const form = (fields = {}) => ({ source: 'Sortie', type: 'Endo', date: '2026-10-01', ...fields });
const rivenForm = (fields = {}) => form({ type: 'Riven Mod', rivenType: 'Rifle', rivenWeaponName: 'Braton', ...fields });

describe('form2reward() of a new reward', () => {
	it('saves a reward from the source and type names, with its date and creator', async () => {
		const reward = await RewardAdapter.form2reward(form(), user._id);
		const saved = await Reward.findById(reward._id);
		expect(saved.source).toEqual(sortie._id);
		expect(saved.type).toEqual(endo._id);
		expect(saved.date.toISOString()).toBe('2026-10-01T12:00:00.000Z');
		expect(saved.createdBy).toEqual(user._id);
		expect(saved.booster).toBeUndefined();
		expect(saved.riven).toBeUndefined();
	});

	it('also accepts the source and type ids', async () => {
		const reward = await RewardAdapter.form2reward(form({ source: String(sortie._id), type: String(endo._id) }), user._id);
		expect(reward.type).toEqual(endo._id);
	});

	it('rejects a reward without date', async () => {
		await expect(RewardAdapter.form2reward(form({ date: undefined }), user._id)).rejects.toThrow('Reward without a date');
	});

	it('rejects an unknown reward type name', async () => {
		await expect(RewardAdapter.form2reward(form({ type: 'Unknown' }), user._id)).rejects.toThrow(/reward type does not exists/);
	});
});

describe('form2reward() of a booster', () => {
	it('saves the booster given by its id', async () => {
		const reward = await RewardAdapter.form2reward(form({ type: 'Booster', booster: String(affinity._id) }), user._id);
		expect(String(reward.booster)).toBe(String(affinity._id));
	});

	it('saves the booster given by its name', async () => {
		const reward = await RewardAdapter.form2reward(form({ type: 'Booster', booster: 'credit' }), user._id);
		expect(reward.booster).toEqual(credit._id);
	});

	it('rejects a booster reward without booster', async () => {
		await expect(RewardAdapter.form2reward(form({ type: 'Booster' }), user._id)).rejects.toThrow('Type is booster but no booster provided.');
	});

	it('rejects an ambiguous booster name', async () => {
		await expect(RewardAdapter.form2reward(form({ type: 'Booster', booster: 'Booster' }), user._id)).rejects.toThrow(/imprecise/);
	});
});

describe('form2reward() of a riven', () => {
	it('creates the riven of the reward', async () => {
		const form = rivenForm({ rivenN: '12', rivenConditions: [String(condition._id), 'none'] });
		const reward = await RewardAdapter.form2reward(form, user._id);
		expect(reward.rivenType).toEqual(rifle._id);
		const riven = await Riven.findById(reward.riven);
		expect(riven.reward).toEqual(reward._id);
		expect(riven.type).toEqual(rifle._id);
		expect(riven.weaponName).toBe('Braton');
		expect(riven.N).toBe(12);
		expect(riven.conditions).toEqual([condition._id]);
		expect(riven.createdBy).toEqual(user._id);
	});

	it('creates the riven from its conditions only', async () => {
		const reward = await RewardAdapter.form2reward(rivenForm({ rivenWeaponName: undefined, rivenConditions: [String(condition._id)] }), user._id);
		expect(reward.riven).toBeDefined();
	});

	it('updates the riven given by its id', async () => {
		const created = await RewardAdapter.form2reward(rivenForm(), user._id);
		const updated = await RewardAdapter.form2reward(rivenForm({ _id: String(created._id), rivenId: String(created.riven), rivenWeaponName: 'Soma' }), user._id);
		expect(updated.riven).toEqual(created.riven);
		const riven = await Riven.findById(created.riven);
		expect(riven.weaponName).toBe('Soma');
		expect(riven.modifiedBy).toEqual(user._id);
		expect(await Riven.countDocuments()).toBe(1);
	});

	it('saves only the riven type of a veiled riven (no riven information)', async () => {
		const reward = await RewardAdapter.form2reward(rivenForm({ rivenWeaponName: undefined, rivenConditions: ['none'] }), user._id);
		expect(reward.rivenType).toEqual(rifle._id);
		expect(reward.riven).toBeUndefined();
		expect(await Riven.countDocuments()).toBe(0);
	});

	it('rejects an unknown riven type', async () => {
		await expect(RewardAdapter.form2reward(rivenForm({ rivenType: 'Kitgun' }), user._id)).rejects.toThrow('Reward with riven but without valid rivenType');
	});

	it('rejects an unknown riven id', async () => {
		await expect(RewardAdapter.form2reward(rivenForm({ rivenId: String(new mongoose.Types.ObjectId()) }), user._id))
			.rejects.toThrow('Reward with Riven ID that doesn\'t exists.');
	});

	it('rejects a riven whose reward source is not a riven source', async () => {
		await expect(RewardAdapter.form2reward(rivenForm({ source: 'Archon Hunt' }), user._id))
			.rejects.toThrow('Riven source doesn\'t correspond to reward source');
	});
});

describe('form2reward() of an existing reward', () => {
	it('updates the reward and records its modifier', async () => {
		const created = await RewardAdapter.form2reward(form(), user._id);
		const updated = await RewardAdapter.form2reward(form({ _id: String(created._id), date: '2026-10-02' }), user._id);
		expect(updated._id).toEqual(created._id);
		expect(updated.date.toISOString()).toBe('2026-10-02T12:00:00.000Z');
		expect(updated.modifiedBy).toEqual(user._id);
		expect(updated.Modified_date).toBeInstanceOf(Date);
	});

	it('removes the booster when the reward is no longer a booster', async () => {
		const created = await RewardAdapter.form2reward(form({ type: 'Booster', booster: 'credit' }), user._id);
		await RewardAdapter.form2reward(form({ _id: String(created._id) }), user._id);
		expect((await Reward.findById(created._id)).booster).toBeNull();
	});

	it('removes the riven type of a veiled riven when the reward is no longer a riven', async () => {
		const created = await RewardAdapter.form2reward(rivenForm({ rivenWeaponName: undefined }), user._id);
		await RewardAdapter.form2reward(form({ _id: String(created._id) }), user._id);
		expect((await Reward.findById(created._id)).rivenType).toBeNull();
	});

	it('rejects an unknown reward id', async () => {
		await expect(RewardAdapter.form2reward(form({ _id: String(new mongoose.Types.ObjectId()) }), user._id))
			.rejects.toThrow('A reward id was provided but no reward found.');
	});

	it('deletes the riven and the riven type when the reward is no longer a riven', async () => {
		const created = await RewardAdapter.form2reward(rivenForm(), user._id);
		await RewardAdapter.form2reward(form({ _id: String(created._id) }), user._id);
		const saved = await Reward.findById(created._id);
		expect(saved.type).toEqual(endo._id);
		expect(saved.riven).toBeNull();
		expect(saved.rivenType).toBeNull();
		expect(await Riven.countDocuments()).toBe(0);
	});

	it('deletes the riven but keeps the riven type when the form has no more riven information', async () => {
		const created = await RewardAdapter.form2reward(rivenForm(), user._id);
		await RewardAdapter.form2reward(rivenForm({ _id: String(created._id), rivenWeaponName: undefined }), user._id);
		const saved = await Reward.findById(created._id);
		expect(saved.riven).toBeNull();
		expect(saved.rivenType).toEqual(rifle._id);
		expect(await Riven.countDocuments()).toBe(0);
	});

	it('keeps the riven when the reward cannot be saved', async () => {
		const created = await RewardAdapter.form2reward(rivenForm(), user._id);
		jest.spyOn(Reward.prototype, 'save').mockRejectedValueOnce(new Error('Database down'));
		await expect(RewardAdapter.form2reward(form({ _id: String(created._id) }), user._id)).rejects.toThrow('Database down');
		jest.restoreAllMocks();
		expect((await Reward.findById(created._id)).riven).toEqual(created.riven);
		expect(await Riven.countDocuments()).toBe(1);
	});
});

describe('form2reward() with unknown ids', () => {
	it('rejects an unknown reward source id with a clear error', async () => {
		await expect(RewardAdapter.form2reward(form({ source: String(new mongoose.Types.ObjectId()) }), user._id)).rejects.toThrow(/reward source/);
	});

	it('rejects an unknown reward type id with a clear error', async () => {
		await expect(RewardAdapter.form2reward(form({ type: String(new mongoose.Types.ObjectId()) }), user._id)).rejects.toThrow(/reward type/);
	});

	it('rejects an unknown booster id', async () => {
		await expect(RewardAdapter.form2reward(form({ type: 'Booster', booster: String(new mongoose.Types.ObjectId()) }), user._id)).rejects.toThrow(/booster type/);
	});
});
