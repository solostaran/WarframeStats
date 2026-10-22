'use strict';

// Unit tests of api/domain/statsProcess.js : the exact counts of each statistic, on known data in an in-memory MongoDB.
// (tests/performance/stats.test.js checks their format and compute time on the real database)
const mongoose = require('mongoose');
const db = require('./fixtures/memoryDb.js');
db.registerModels();
const StatsProcess = require('#root/api/domain/statsProcess.js');
const { netracellRewardTypes } = require('#root/api/models/netracellModel.js');
const { temporalRewardTypes } = require('#root/api/models/temporalModel.js');

const Reward = mongoose.model('Reward');
const RewardType = mongoose.model('RewardType');

let sortie, endo, rivenMod, booster, rifle, shotgun, affinity;
beforeAll(async () => {
	await db.connect(__filename);
	sortie = await mongoose.model('RewardSource').create({ name: 'Sortie' });
	endo = await RewardType.create({ name: 'Endo' });
	rivenMod = await RewardType.create({ name: 'Riven Mod' });
	booster = await RewardType.create({ name: 'Booster' });
	await RewardType.create({ name: 'Forma' });	// no reward of that type
	rifle = await mongoose.model('RivenType').create({ name: 'Rifle' });
	shotgun = await mongoose.model('RivenType').create({ name: 'Shotgun' });
	affinity = await mongoose.model('BoosterType').create({ name: 'Affinity Booster', description: 'x2 affinity' });
	await mongoose.model('BoosterType').create({ name: 'Credit Booster', description: 'x2 credits' });

	const reward = fields => ({ source: sortie._id, date: new Date(), ...fields });
	await Reward.insertMany([
		reward({ type: endo._id }), reward({ type: endo._id }), reward({ type: endo._id }),
		reward({ type: rivenMod._id, rivenType: rifle._id }), reward({ type: rivenMod._id, rivenType: rifle._id }),
		reward({ type: rivenMod._id, rivenType: new mongoose.Types.ObjectId() }),	// a riven type that no longer exists
		reward({ type: booster._id, booster: affinity._id })
	]);

	const loot = (type, tauforged) => ({ reward: { type }, tauforged });
	await mongoose.model('NetracellReward').create([
		{ source: { type: 'Netracell' }, loots: [loot('Azure Archon Shard', true)] },
		{ source: { type: 'Netracell' }, loots: [loot('Melee Duplicate')] },
		{ source: { type: 'Deep Archimedea' }, loots: [loot('Azure Archon Shard'), loot('Amber Archon Shard'), loot('Melee Duplicate')] }
	]);
	await mongoose.model('TemporalReward').create([
		{ source: { type: 'Temporal Archimedea' }, loots: [loot('Omni Forma'), loot('Omni Forma'), loot('Violet Archon Shard', true)] }
	]);
});
afterAll(() => db.disconnect());

// every reward type of a run source at 0, plus the given counts
const zeros = (types, counts) => ({ ...Object.fromEntries(types.map(type => [type, 0])), ...counts });

describe('reward_stats()', () => {
	it('counts the rewards of each reward type', async () => {
		const { listStats, totalCount } = await StatsProcess.reward_stats();
		expect(listStats.map(s => [s.type.name, s.count])).toEqual([['Endo', 3], ['Riven Mod', 3], ['Booster', 1], ['Forma', 0]]);
		expect(totalCount).toBe(7);
	});
});

describe('riven() and booster()', () => {
	it('counts the riven rewards of each riven type, and every riven reward', async () => {
		expect(await StatsProcess.riven()).toEqual({ stats: { Rifle: 2, Shotgun: 0 }, count: 3 });
	});

	it('counts the booster rewards of each booster type', async () => {
		expect(await StatsProcess.booster()).toEqual({ stats: { 'Affinity Booster': 1, 'Credit Booster': 0 }, count: 1 });
	});

	it('adds up the sub-types of the same name', async () => {
		const other = await mongoose.model('RivenType').create({ name: 'Shotgun' });
		await Reward.create({ source: sortie._id, type: rivenMod._id, rivenType: other._id });
		await Reward.create({ source: sortie._id, type: rivenMod._id, rivenType: shotgun._id });
		expect((await StatsProcess.riven()).stats.Shotgun).toBe(2);
		await Reward.deleteMany({ rivenType: { $in: [other._id, shotgun._id] } });
		await other.deleteOne();
	});

	it('rejects when the reward type of the statistic does not exist', async () => {
		await RewardType.updateOne({ _id: booster._id }, { name: 'Boost' });
		await expect(StatsProcess.booster()).rejects.toThrow(/does not exists/);
		await RewardType.updateOne({ _id: booster._id }, { name: 'Booster' });
	});
});

describe('netracell_stats() and temporal_stats()', () => {
	it('counts the loots of each reward type, the loots and the runs, per source', async () => {
		expect(await StatsProcess.netracell_stats()).toEqual([
			{ source: 'Netracell', listStats: zeros(netracellRewardTypes, { 'Azure Archon Shard': 1, 'Melee Duplicate': 1 }), totalCount: 2, runCount: 2 },
			{ source: 'Deep Archimedea', listStats: zeros(netracellRewardTypes, { 'Azure Archon Shard': 1, 'Amber Archon Shard': 1, 'Melee Duplicate': 1 }), totalCount: 3, runCount: 1 }
		]);
		expect(await StatsProcess.temporal_stats()).toEqual([
			{ source: 'Temporal Archimedea', listStats: zeros(temporalRewardTypes, { 'Omni Forma': 2, 'Violet Archon Shard': 1 }), totalCount: 3, runCount: 1 }
		]);
	});

	it('ignores the loots of an unknown reward type', async () => {
		const Netracell = mongoose.model('NetracellReward');
		const { insertedId } = await Netracell.collection.insertOne({ source: { type: 'Netracell' }, loots: [{ reward: { type: 'Retired type' } }] });
		const [netracell] = await StatsProcess.netracell_stats();
		expect(netracell.totalCount).toBe(2);
		expect(netracell.runCount).toBe(3);
		await Netracell.collection.deleteOne({ _id: insertedId });
	});

	it('gives zero counts for a source without runs', async () => {
		await mongoose.model('TemporalReward').deleteMany({});
		expect(await StatsProcess.temporal_stats()).toEqual([
			{ source: 'Temporal Archimedea', listStats: zeros(temporalRewardTypes, {}), totalCount: 0, runCount: 0 }
		]);
	});
});
