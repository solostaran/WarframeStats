'use strict';

// Riven and booster statistics : format and compute time of riven() and booster() (aggregations),
// on the data of an existing database, read only (nothing is written).
// Database : MONGO_URI, default mongodb://127.0.0.1/WarframeStatsDB (the app outside Docker).

const mongoose = require('mongoose');

// Mongoose Schemas, before the business processes (they get their models when required)
require('../../api/models/rivenTypeModel');
require('../../api/models/rivenSourceModel');
require('../../api/models/rivenConditionModel');
require('../../api/models/rivenModel');
require('../../api/models/boosterTypeModel');
require('../../api/models/rewardTypeModel');
require('../../api/models/rewardSourceModel');
require('../../api/models/rewardModel');
require('../../api/models/Users');
require('../../api/models/netracellModel');

const StatsProcess = require('../../api/business/statsProcess');
const RivenTypeProcess = require('../../api/business/rivenTypeProcess');
const BoosterTypeProcess = require('../../api/business/boosterTypeProcess');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1/WarframeStatsDB';
const MAX_MS = 100;

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

describe('riven and booster statistics', () => {
	const runs = {};
	const typeNames = {};

	beforeAll(async () => {
		await mongoose.connect(MONGO_URI, { family: 4, serverSelectionTimeoutMS: 3000 })
			.catch(err => { throw new Error('Database ' + MONGO_URI + ' unreachable : ' + err.message); });
		await mongoose.connection.db.admin().ping();	// connection ready : not part of the timing
		for (const [name, typeProcess] of kinds) {
			typeNames[name] = (await typeProcess.list()).map(t => t.name);
			runs[name] = await timed(name, StatsProcess[name]);
		}
	});

	afterAll(async () => {
		await mongoose.disconnect();
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
});
