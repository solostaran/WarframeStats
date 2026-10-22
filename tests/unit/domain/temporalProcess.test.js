'use strict';

// Unit tests of api/domain/temporalProcess.js (Temporal Archimedea runs), against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('./fixtures/memoryDb.js');
db.registerModels();
const TemporalProcess = require('#root/api/domain/temporalProcess.js');
const { temporalRewardTypes, temporalRewardSources } = require('#root/api/models/temporalModel.js');
const { obfuscate_email } = require('#root/security/utils/obfuscation.js');

const Temporal = mongoose.model('TemporalReward');

// seedTypes() with callbacks, as a promise
const seeded = seed => new Promise((resolve, reject) => seed(resolve, reject));

let user;
beforeAll(async () => {
	await db.connect(__filename);
	user = await db.seedUser();
	jest.spyOn(console, 'log').mockImplementation(() => {});
	await seeded(TemporalProcess.setTypes);
	await seeded(TemporalProcess.setSources);
});
afterEach(() => Temporal.deleteMany({}));
afterAll(async () => {
	jest.restoreAllMocks();
	await db.disconnect();
});

const run = (fields = {}) => ({ source: 'Temporal Archimedea', loots: [{ reward: 'Violet Archon Shard', tauforged: true }], date: '2026-01-01', ...fields });

describe('setTypes(), setSources(), listTypes() and listSources()', () => {
	it('lists the seeded reward types and sources', async () => {
		expect((await TemporalProcess.listTypes()).map(t => t.type).sort()).toEqual([...temporalRewardTypes].sort());
		expect((await TemporalProcess.listSources()).map(s => s.type)).toEqual(temporalRewardSources);
	});
});

describe('addOrUpdate() of a new run', () => {
	it('saves a run with its tauforged shard, date and creator', async () => {
		const saved = await TemporalProcess.addOrUpdate(run(), user._id);
		expect(saved.source.type).toBe('Temporal Archimedea');
		expect(saved.loots.map(l => [l.reward.type, l.tauforged])).toEqual([['Violet Archon Shard', true]]);
		expect(saved.date.toISOString()).toBe('2026-01-01T00:00:00.000Z');
		expect(saved.createdBy).toEqual(user._id);
	});

	it('saves 3 loots, tauforged from "true" and for a shard only', async () => {
		const loots = [{ reward: 'Topaz Archon Shard', tauforged: 'true' }, { reward: 'Omni Forma', tauforged: true }, { reward: 'Arcane Escapist' }];
		const saved = await TemporalProcess.addOrUpdate(run({ loots, date: undefined }), user._id);
		expect(saved.loots.map(l => [l.reward.type, l.tauforged])).toEqual([
			['Topaz Archon Shard', true], ['Omni Forma', undefined], ['Arcane Escapist', undefined]
		]);
		expect(saved.date).toBeUndefined();
	});

	it('rejects a wrong number of loots', async () => {
		await expect(TemporalProcess.addOrUpdate(run({ loots: [] }), user._id)).rejects.toThrow('A Temporal Archimedea reward has 1 to 3 loots.');
		await expect(TemporalProcess.addOrUpdate(run({ loots: Array(4).fill({ reward: 'Omni Forma' }) }), user._id)).rejects.toThrow(/1 to 3 loots/);
		await expect(TemporalProcess.addOrUpdate({ source: 'Temporal Archimedea' }, user._id)).rejects.toThrow(/1 to 3 loots/);
	});

	it('rejects an unknown reward type or source', async () => {
		await expect(TemporalProcess.addOrUpdate(run({ loots: [{ reward: 'Forma' }] }), user._id)).rejects.toThrow('Wrong temporal reward type.');
		await expect(TemporalProcess.addOrUpdate(run({ loots: [null] }), user._id)).rejects.toThrow('Wrong temporal reward type.');
		await expect(TemporalProcess.addOrUpdate(run({ source: 'Netracell' }), user._id)).rejects.toThrow('Wrong temporal reward source.');
	});

	it('rejects a null object', async () => {
		await expect(TemporalProcess.addOrUpdate(null, user._id)).rejects.toBe('Null object');
	});
});

describe('addOrUpdate() of an existing run', () => {
	it('updates the run and records its modifier', async () => {
		const created = await TemporalProcess.addOrUpdate(run(), user._id);
		const loots = [{ reward: 'Omni Forma' }, { reward: 'Elemental Vice' }];
		const updated = await TemporalProcess.addOrUpdate(run({ _id: String(created._id), loots, date: '2026-01-05' }), user._id);
		expect(updated._id).toEqual(created._id);
		expect(updated.loots).toHaveLength(2);
		expect(updated.date.toISOString()).toBe('2026-01-05T00:00:00.000Z');
		expect(updated.modifiedBy).toEqual(user._id);
		expect(updated.Modified_date).toBeInstanceOf(Date);
		expect(await TemporalProcess.count()).toBe(1);
	});

	it('rejects an unknown run id', async () => {
		await expect(TemporalProcess.addOrUpdate(run({ _id: String(new mongoose.Types.ObjectId()) }), user._id))
			.rejects.toThrow('A temporal id was provided but no temporal reward found.');
	});
});

describe('adds()', () => {
	it('saves several runs and counts the inserted and rejected ones', async () => {
		const runs = [run(), run({ loots: [] })];
		const result = await new Promise((resolve, reject) => TemporalProcess.adds(runs, user._id, resolve, reject));
		expect(result.insertedCount).toBe(1);
		expect(result.rejectedCount).toBe(1);
		expect(result.rejects[0].reject).toBe(runs[1]);
	});

	it('calls onError when onSuccess fails', async () => {
		const error = await new Promise(resolve => TemporalProcess.adds([], user._id, () => { throw new Error('onSuccess failed'); }, resolve));
		expect(error.message).toBe('onSuccess failed');
	});
});

describe('list_raw()', () => {
	it('lists the runs as text, newest first', async () => {
		await TemporalProcess.addOrUpdate(run(), user._id);
		const loots = [{ reward: 'Emerald Archon Shard', tauforged: true }, { reward: 'Omni Forma Blueprint' }];
		await TemporalProcess.addOrUpdate(run({ loots, date: '2026-01-02' }), user._id);
		const list = await TemporalProcess.list_raw();
		expect(list.map(({ source, rewards, lootCount }) => ({ source, rewards, lootCount }))).toEqual([
			{ source: 'Temporal Archimedea', rewards: 'Emerald Archon Shard (Tauforged), Omni Forma Blueprint', lootCount: 2 },
			{ source: 'Temporal Archimedea', rewards: 'Violet Archon Shard (Tauforged)', lootCount: 1 }
		]);
	});

	it('lists a run without source nor loots', async () => {
		await Temporal.collection.insertOne({ date: new Date() });
		const [listed] = await TemporalProcess.list_raw();
		expect(listed.source).toBeUndefined();
		expect(listed.rewards).toBe('');
		expect(listed.lootCount).toBe(0);
	});
});

describe('findById()', () => {
	it('returns the run with its creator and modifier as a semi-obfuscated email only', async () => {
		const created = await TemporalProcess.addOrUpdate(run(), user._id);
		await TemporalProcess.addOrUpdate(run({ _id: String(created._id) }), user._id);
		const json = (await TemporalProcess.findById(created._id)).toJSON();	// what a visitor receives
		expect(json.createdBy).toEqual({ email: obfuscate_email(user.email) });
		expect(json.modifiedBy).toEqual({ email: obfuscate_email(user.email) });
	});

	it('returns a run without creator', async () => {
		const created = await TemporalProcess.addOrUpdate(run(), undefined);
		expect((await TemporalProcess.findById(created._id)).createdBy).toBeUndefined();
	});

	it('returns undefined for an unknown id, and rejects a malformed id', async () => {
		expect(await TemporalProcess.findById(new mongoose.Types.ObjectId())).toBeUndefined();
		await expect(TemporalProcess.findById('malformed')).rejects.toThrow(/Cast to ObjectId failed/);
	});
});

describe('deleteOneById() and deleteAll()', () => {
	it('deletes a run and returns it', async () => {
		const created = await TemporalProcess.addOrUpdate(run(), user._id);
		expect((await TemporalProcess.deleteOneById(created._id))._id).toEqual(created._id);
		expect(await TemporalProcess.count()).toBe(0);
	});

	it('rejects an unknown run id', async () => {
		const unknown = new mongoose.Types.ObjectId();
		await expect(TemporalProcess.deleteOneById(unknown)).rejects.toBe('Cannot find temporal whose ID = ' + unknown);
	});

	it('deletes every run', async () => {
		await TemporalProcess.addOrUpdate(run(), user._id);
		await TemporalProcess.addOrUpdate(run(), user._id);
		expect((await TemporalProcess.deleteAll()).deletedCount).toBe(2);
	});
});
