'use strict';

// Unit tests of api/domain/seedTypes.js (seeded collections of the netracell and temporal types), against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('./fixtures/memoryDb.js');
db.registerModels();
const seed = require('#root/api/domain/seedTypes.js');

const NetracellRewardSource = mongoose.model('NetracellRewardSource');

beforeAll(() => db.connect(__filename));
beforeEach(() => jest.spyOn(console, 'log').mockImplementation(() => {}));
afterEach(async () => {
	jest.restoreAllMocks();
	await db.clear();
});
afterAll(() => db.disconnect());

// seed() with callbacks, as a promise of { result } or { error }
const seeded = (types, onSuccess) => new Promise(resolve =>
	seed(NetracellRewardSource, types, 'Test', result => resolve({ result: onSuccess ? onSuccess(result) : result }), error => resolve({ error })));

describe('seed()', () => {
	it('inserts one document { type } per value and gives the counts', async () => {
		const { result } = await seeded(['Netracell', 'Deep Archimedea']);
		expect(result).toEqual({ insertedCount: 2, rejectedCount: 0, rejects: [] });
		expect((await NetracellRewardSource.find({}).sort({ type: 1 })).map(s => s.type)).toEqual(['Deep Archimedea', 'Netracell']);
	});

	it('rejects a value refused by the model, and keeps the others', async () => {
		const { result } = await seeded(['Netracell', 'Unknown source']);
		expect(result.insertedCount).toBe(1);
		expect(result.rejectedCount).toBe(1);
		expect(result.rejects[0].reject).toBe('Unknown source');
		expect(result.rejects[0].error.name).toBe('ValidationError');
	});

	it('calls onError when onSuccess fails', async () => {
		const { error } = await seeded(['Netracell'], () => { throw new Error('onSuccess failed'); });
		expect(error.message).toBe('onSuccess failed');
	});
});
