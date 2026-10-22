'use strict';

// Unit tests of api/domain/netracellRewardProcess.js (Netracell and Deep Archimedea runs), against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('./fixtures/memoryDb.js');
db.registerModels();
const NetracellProcess = require('#root/api/domain/netracellRewardProcess.js');
const { netracellRewardTypes, netracellRewardSources } = require('#root/api/models/netracellModel.js');
const { obfuscate_email } = require('#root/security/utils/obfuscation.js');

const Netracell = mongoose.model('NetracellReward');

// seedTypes() with callbacks, as a promise
const seeded = seed => new Promise((resolve, reject) => seed(resolve, reject));

let user;
beforeAll(async () => {
	await db.connect(__filename);
	user = await db.seedUser();
	jest.spyOn(console, 'log').mockImplementation(() => {});
	await seeded(NetracellProcess.setTypes);
	await seeded(NetracellProcess.setSources);
});
afterEach(() => Netracell.deleteMany({}));
afterAll(async () => {
	jest.restoreAllMocks();
	await db.disconnect();
});

const run = (fields = {}) => ({ source: 'Netracell', loots: [{ reward: 'Azure Archon Shard', tauforged: true }], date: '2026-01-01', ...fields });

describe('setTypes(), setSources(), listTypes() and listSources()', () => {
	it('lists the seeded reward types and sources', async () => {
		expect((await NetracellProcess.listTypes()).map(t => t.type).sort()).toEqual([...netracellRewardTypes].sort());
		expect((await NetracellProcess.listSources()).map(s => s.type).sort()).toEqual([...netracellRewardSources].sort());
	});
});

describe('addOrUpdate() of a new run', () => {
	it('saves a Netracell run with its tauforged shard, date and creator', async () => {
		const saved = await NetracellProcess.addOrUpdate(run(), user._id);
		expect(saved.source.type).toBe('Netracell');
		expect(saved.loots).toHaveLength(1);
		expect(saved.loots[0].reward.type).toBe('Azure Archon Shard');
		expect(saved.loots[0].tauforged).toBe(true);
		expect(saved.date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
		expect(saved.createdBy).toEqual(user._id);
	});

	it('saves a Deep Archimedea run with 3 loots, tauforged from "true" and for a shard only', async () => {
		const loots = [{ reward: 'Crimson Archon Shard', tauforged: 'true' }, { reward: 'Melee Duplicate', tauforged: true }, { reward: 'Amber Archon Shard' }];
		const saved = await NetracellProcess.addOrUpdate(run({ source: 'Deep Archimedea', loots }), user._id);
		expect(saved.loots.map(l => [l.reward.type, l.tauforged])).toEqual([
			['Crimson Archon Shard', true], ['Melee Duplicate', undefined], ['Amber Archon Shard', undefined]
		]);
	});

	it('accepts the single loot of the former API (reward and tauforged fields)', async () => {
		const saved = await NetracellProcess.addOrUpdate({ source: 'Netracell', reward: 'Melee Crescendo' }, user._id);
		expect(saved.loots.map(l => l.reward.type)).toEqual(['Melee Crescendo']);
		expect(saved.date).toBeUndefined();
	});

	it('rejects a wrong number of loots', async () => {
		await expect(NetracellProcess.addOrUpdate(run({ loots: [] }), user._id)).rejects.toThrow('A Netracell reward has 1 loot.');
		const four = Array(4).fill({ reward: 'Melee Duplicate' });
		await expect(NetracellProcess.addOrUpdate(run({ source: 'Deep Archimedea', loots: four }), user._id)).rejects.toThrow('A Deep Archimedea reward has 1 to 3 loots.');
		await expect(NetracellProcess.addOrUpdate({ source: 'Netracell' }, user._id)).rejects.toThrow('A Netracell reward has 1 loot.');
	});

	it('rejects an unknown reward type or source', async () => {
		await expect(NetracellProcess.addOrUpdate(run({ loots: [{ reward: 'Forma' }] }), user._id)).rejects.toThrow('Wrong netracell reward type.');
		await expect(NetracellProcess.addOrUpdate(run({ loots: [null] }), user._id)).rejects.toThrow('Wrong netracell reward type.');
		await expect(NetracellProcess.addOrUpdate(run({ source: 'Sortie' }), user._id)).rejects.toThrow('Wrong netracell reward source.');
	});

	it('rejects a null object', async () => {
		await expect(NetracellProcess.addOrUpdate(null, user._id)).rejects.toBe('Null object');
	});
});

describe('addOrUpdate() of an existing run', () => {
	it('updates the run and records its modifier', async () => {
		const created = await NetracellProcess.addOrUpdate(run(), user._id);
		const updated = await NetracellProcess.addOrUpdate(run({ _id: String(created._id), source: 'Deep Archimedea', date: '2026-01-05' }), user._id);
		expect(updated._id).toEqual(created._id);
		expect(updated.source.type).toBe('Deep Archimedea');
		expect(updated.date.toISOString()).toBe('2026-01-05T00:00:00.000Z');
		expect(updated.modifiedBy).toEqual(user._id);
		expect(updated.Modified_date).toBeInstanceOf(Date);
		expect(await NetracellProcess.count()).toBe(1);
	});

	it('rejects an unknown run id', async () => {
		await expect(NetracellProcess.addOrUpdate(run({ _id: String(new mongoose.Types.ObjectId()) }), user._id))
			.rejects.toThrow('A netracell id was provided but no netracell reward found.');
	});
});

describe('adds()', () => {
	it('saves several runs and counts the inserted and rejected ones', async () => {
		const runs = [run(), run({ source: 'Sortie' })];
		const result = await new Promise((resolve, reject) => NetracellProcess.adds(runs, user._id, resolve, reject));
		expect(result.insertedCount).toBe(1);
		expect(result.rejectedCount).toBe(1);
		expect(result.rejects[0].reject).toBe(runs[1]);
	});

	it('calls onError when onSuccess fails', async () => {
		const error = await new Promise(resolve => NetracellProcess.adds([], user._id, () => { throw new Error('onSuccess failed'); }, resolve));
		expect(error.message).toBe('onSuccess failed');
	});
});

describe('list_raw()', () => {
	it('lists the runs as text, newest first', async () => {
		await NetracellProcess.addOrUpdate(run(), user._id);
		const loots = [{ reward: 'Azure Archon Shard', tauforged: true }, { reward: 'Melee Duplicate' }];
		await NetracellProcess.addOrUpdate(run({ source: 'Deep Archimedea', loots, date: '2026-01-02' }), user._id);
		const list = await NetracellProcess.list_raw();
		expect(list.map(({ source, rewards, lootCount }) => ({ source, rewards, lootCount }))).toEqual([
			{ source: 'Deep Archimedea', rewards: 'Azure Archon Shard (Tauforged), Melee Duplicate', lootCount: 2 },
			{ source: 'Netracell', rewards: 'Azure Archon Shard (Tauforged)', lootCount: 1 }
		]);
	});

	it('lists a run without source nor loots', async () => {
		await Netracell.collection.insertOne({ date: new Date() });
		const [listed] = await NetracellProcess.list_raw();
		expect(listed.source).toBeUndefined();
		expect(listed.rewards).toBe('');
		expect(listed.lootCount).toBe(0);
	});
});

describe('findById()', () => {
	it('returns the run with its creator and modifier as a semi-obfuscated email only', async () => {
		const created = await NetracellProcess.addOrUpdate(run(), user._id);
		await NetracellProcess.addOrUpdate(run({ _id: String(created._id) }), user._id);
		const json = (await NetracellProcess.findById(created._id)).toJSON();	// what a visitor receives
		expect(json.createdBy).toEqual({ email: obfuscate_email(user.email) });
		expect(json.modifiedBy).toEqual({ email: obfuscate_email(user.email) });
	});

	it('returns a run without creator', async () => {
		const created = await NetracellProcess.addOrUpdate(run(), undefined);
		expect((await NetracellProcess.findById(created._id)).createdBy).toBeUndefined();
	});

	it('returns undefined for an unknown id, and rejects a malformed id', async () => {
		expect(await NetracellProcess.findById(new mongoose.Types.ObjectId())).toBeUndefined();
		await expect(NetracellProcess.findById('malformed')).rejects.toThrow(/Cast to ObjectId failed/);
	});
});

describe('deleteOneById() and deleteAll()', () => {
	it('deletes a run and returns it', async () => {
		const created = await NetracellProcess.addOrUpdate(run(), user._id);
		expect((await NetracellProcess.deleteOneById(created._id))._id).toEqual(created._id);
		expect(await NetracellProcess.count()).toBe(0);
	});

	it('rejects an unknown run id', async () => {
		const unknown = new mongoose.Types.ObjectId();
		await expect(NetracellProcess.deleteOneById(unknown)).rejects.toBe('Cannot find netracell whose ID = ' + unknown);
	});

	it('deletes every run', async () => {
		await NetracellProcess.addOrUpdate(run(), user._id);
		await NetracellProcess.addOrUpdate(run(), user._id);
		expect((await NetracellProcess.deleteAll()).deletedCount).toBe(2);
	});
});
