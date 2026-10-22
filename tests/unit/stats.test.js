'use strict';

// Reward, riven, booster, netracell and temporal statistics : format and compute time of reward_stats(), riven(), booster(),
// netracell_stats() and temporal_stats() (aggregations),
// on the data of an existing database, read only (nothing is written).
// Database : MONGO_URI, default mongodb://127.0.0.1/WarframeStatsDB (the app outside Docker).

const mongoose = require('mongoose');

// Mongoose Schemas, before the business processes (they get their models when required)
require('#root/api/models/rivenTypeModel.js');
require('#root/api/models/rivenSourceModel.js');
require('#root/api/models/rivenConditionModel.js');
require('#root/api/models/rivenModel.js');
require('#root/api/models/boosterTypeModel.js');
require('#root/api/models/rewardTypeModel.js');
require('#root/api/models/rewardSourceModel.js');
require('#root/api/models/rewardModel.js');
require('#root/api/models/Users.js');
const { netracellRewardSources, netracellRewardTypes } = require('#root/api/models/netracellModel.js');
const { temporalRewardSources, temporalRewardTypes } = require('#root/api/models/temporalModel.js');

const StatsProcess = require('#root/api/domain/statsProcess.js');
const RivenTypeProcess = require('#root/api/domain/rivenTypeProcess.js');
const BoosterTypeProcess = require('#root/api/domain/boosterTypeProcess.js');
const RewardTypeProcess = require('#root/api/domain/rewardTypeProcess.js');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1/WarframeStatsDB';
const MAX_MS = 150;

// result of fn() and its compute time in ms
async function timed(name, fn) {
	const start = process.hrtime.bigint();
	const result = await fn();
	const ms = Number(process.hrtime.bigint() - start) / 1e6;
	console.log(name + '(): ' + ms.toFixed(3) + ' ms');
	return { result, ms };
}

// statistic name : the process that lists its types
const kinds = [['riven', RivenTypeProcess], ['booster', BoosterTypeProcess]];

describe('reward, riven, booster, netracell and temporal statistics', () => {
	const runs = {};
	const typeNames = {};

	beforeAll(async () => {
		await mongoose.connect(MONGO_URI, { family: 4, serverSelectionTimeoutMS: 3000 })
			.catch(err => { throw new Error('Database ' + MONGO_URI + ' unreachable : ' + err.message); });
		await mongoose.connection.db.admin().ping();	// connection ready : not part of the timing
		typeNames.reward_stats = (await RewardTypeProcess.list()).map(rt => rt.name);
		runs.reward_stats = await timed('reward_stats', StatsProcess.reward_stats);
		for (const [name, typeProcess] of kinds) {
			typeNames[name] = (await typeProcess.list()).map(t => t.name);
			runs[name] = await timed(name, StatsProcess[name]);
		}
		runs.netracell_stats = await timed('netracell_stats', StatsProcess.netracell_stats);
		runs.temporal_stats = await timed('temporal_stats', StatsProcess.temporal_stats);
	});

	afterAll(async () => {
		await mongoose.disconnect();
	});

	describe('reward_stats()', () => {
		it('returns { listStats: [{ type, count }], totalCount }', () => {
			const { result } = runs.reward_stats;
			expect(Object.keys(result).sort()).toEqual(['listStats', 'totalCount']);
			expect(Array.isArray(result.listStats)).toBe(true);
			expect(result.listStats.map(s => s.type.name)).toEqual(typeNames.reward_stats);
			result.listStats.forEach(s => {
				expect(Object.keys(s).sort()).toEqual(['count', 'type']);
				expect(Number.isInteger(s.count)).toBe(true);
				expect(s.count).toBeGreaterThanOrEqual(0);
			});
			expect(Number.isInteger(result.totalCount)).toBe(true);
			expect(result.listStats.reduce((total, s) => total + s.count, 0)).toBe(result.totalCount);
		});

		it('is computed in less than ' + MAX_MS + ' ms', () => {
			expect(runs.reward_stats.ms).toBeLessThan(MAX_MS);
		});
	});

	describe.each(kinds.map(([name]) => name))('%s()', (name) => {
		it('returns { stats: { type name: count }, count }', () => {
			const { result } = runs[name];
			expect(Object.keys(result).sort()).toEqual(['count', 'stats']);
			expect(Number.isInteger(result.count)).toBe(true);
			expect(result.count).toBeGreaterThanOrEqual(0);
			expect(Object.getPrototypeOf(result.stats)).toBe(Object.prototype);
			expect(Object.keys(result.stats)).toEqual([...new Set(typeNames[name])]);
			Object.values(result.stats).forEach(value => {
				expect(Number.isInteger(value)).toBe(true);
				expect(value).toBeGreaterThanOrEqual(0);
			});
			expect(Object.values(result.stats).reduce((total, value) => total + value, 0)).toBe(result.count);
		});

		it('is computed in less than ' + MAX_MS + ' ms', () => {
			expect(runs[name].ms).toBeLessThan(MAX_MS);
		});
	});

	// [name, sources, types] of the statistics of runs with 1 to 3 loots
	const lootKinds = [
		['netracell_stats', netracellRewardSources, netracellRewardTypes],
		['temporal_stats', temporalRewardSources, temporalRewardTypes]
	];

	describe.each(lootKinds)('%s()', (name, rewardSources, rewardTypes) => {
		it('returns [{ source, listStats: { type: count }, totalCount, runCount }], one per source', () => {
			const { result } = runs[name];
			expect(result.map(s => s.source)).toEqual(rewardSources);
			result.forEach(s => {
				expect(Object.keys(s).sort()).toEqual(['listStats', 'runCount', 'source', 'totalCount']);
				expect(Object.keys(s.listStats)).toEqual(rewardTypes);
				Object.values(s.listStats).forEach(value => {
					expect(Number.isInteger(value)).toBe(true);
					expect(value).toBeGreaterThanOrEqual(0);
				});
				expect(Object.values(s.listStats).reduce((total, value) => total + value, 0)).toBe(s.totalCount);
				// 1 to 3 loots per run
				expect(s.runCount).toBeLessThanOrEqual(s.totalCount);
				expect(s.totalCount).toBeLessThanOrEqual(3 * s.runCount);
			});
		});

		it('is computed in less than ' + MAX_MS + ' ms', () => {
			expect(runs[name].ms).toBeLessThan(MAX_MS);
		});
	});
});
