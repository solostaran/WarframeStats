'use strict';

// Unit tests of api/domain/rivenAdapter.js (riven form -> riven document), against an in-memory MongoDB
const mongoose = require('mongoose');
const db = require('#root/tests/fixtures/memoryDb.js');
db.registerModels();
const RivenAdapter = require('#root/api/domain/rivenAdapter.js');

const Riven = mongoose.model('Riven');

let user, rifle, sortie, condition;
beforeAll(async () => {
	await db.connect(__filename);
	user = await db.seedUser();
	rifle = await mongoose.model('RivenType').create({ name: 'Rifle' });
	sortie = await mongoose.model('RivenSource').create({ name: 'Sortie' });
	condition = await mongoose.model('RivenCondition').create({ description: 'Kill N enemies' });
});
afterEach(() => Riven.deleteMany({}));
afterAll(() => db.disconnect());

const form = (fields = {}) => ({ type: 'Rifle', source: 'Sortie', weaponName: 'Braton', ...fields });

describe('form2riven() of a new riven', () => {
	it('builds an unsaved riven from the type and source names', async () => {
		const riven = await RivenAdapter.form2riven(form({ conditions: [String(condition._id), 'none'], N: '10' }), user._id);
		expect(riven.isNew).toBe(true);
		await riven.save();
		const saved = await Riven.findById(riven._id);
		expect(saved.type).toEqual(rifle._id);
		expect(saved.source).toEqual(sortie._id);
		expect(saved.weaponName).toBe('Braton');
		expect(saved.conditions).toEqual([condition._id]);
		expect(saved.N).toBe(10);
		expect(saved.createdBy).toEqual(user._id);
	});

	it('also accepts the type and source ids', async () => {
		const riven = await RivenAdapter.form2riven(form({ type: String(rifle._id), source: String(sortie._id) }), user._id);
		await riven.save();
		expect((await Riven.findById(riven._id)).type).toEqual(rifle._id);
	});

	it('has no conditions and no N when the form has none', async () => {
		const riven = await RivenAdapter.form2riven(form(), user._id);
		expect(riven.conditions).toEqual([]);
		expect(riven.N).toBeUndefined();
	});

	it('rejects an unknown riven type', async () => {
		await expect(RivenAdapter.form2riven(form({ type: 'Kitgun' }), user._id)).rejects.toBe('This riven type cannot be defined : Kitgun');
	});

	it('rejects an unknown riven source', async () => {
		await expect(RivenAdapter.form2riven(form({ source: 'Invasion' }), user._id)).rejects.toBe('This riven source cannot be defined : Invasion');
	});
});

describe('form2riven() of an existing riven', () => {
	let existing;
	beforeEach(async () => {
		const riven = await RivenAdapter.form2riven(form({ conditions: [String(condition._id)], N: 5 }), user._id);
		existing = await riven.save();
	});

	it('updates the riven and records its modifier', async () => {
		const modifier = await db.seedUser('modifier@example.com');
		const riven = await RivenAdapter.form2riven(form({ _id: String(existing._id), weaponName: 'Soma', N: 8 }), modifier._id);
		expect(riven.isNew).toBe(false);
		expect(riven.weaponName).toBe('Soma');
		expect(riven.N).toBe(8);
		expect(riven.modifiedBy).toEqual(modifier._id);
		expect(riven.Modified_date).toBeInstanceOf(Date);
	});

	it('removes the old N when the form has none', async () => {
		const riven = await RivenAdapter.form2riven(form({ _id: String(existing._id) }), user._id);
		await riven.save();
		const saved = await Riven.findById(existing._id);
		expect(saved.N).toBeUndefined();
		expect(saved.conditions).toEqual([]);
	});

	it('rejects an unknown riven id', async () => {
		await expect(RivenAdapter.form2riven(form({ _id: String(new mongoose.Types.ObjectId()) }), user._id))
			.rejects.toBe('A riven ID was provided but no riven found.');
	});
});
