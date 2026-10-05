'use strict';

const mongoose = require('mongoose'),
	{ toOptions } = require('../formEngine'),
	{ date2string } = require('../../utils/convertDates'),
	RewardTypeProcess = require('../../business/rewardTypeProcess'),
	RewardSourceProcess = require('../../business/rewardSourceProcess'),
	BoosterTypeProcess = require('../../business/boosterTypeProcess'),
	RivenTypeProcess = require('../../business/rivenTypeProcess'),
	RewardProcess = require('../../business/rewardProcess');

const Reward = mongoose.model('Reward');
const idOf = value => (value ? String(value) : '');

module.exports = {
	id: 'reward',
	title: 'Add a reward',
	submitLabel: 'Add reward',
	editTitle: 'Edit a reward',
	editSubmitLabel: 'Update',
	async fields() {
		const types = await RewardTypeProcess.list();
		// same detection as api/business/rewardAdapter.js (name containing "Booster" or "Riven")
		const typeIds = pattern => types.filter(type => pattern.test(type.name)).map(type => String(type._id));
		return [
			{ name: 'date', label: 'Date of acquisition', type: 'date', required: true },
			{ name: 'source', label: 'Reward source', type: 'select', required: true,
				options: toOptions(await RewardSourceProcess.list()) },
			{ name: 'type', label: 'Reward type', type: 'select', required: true,
				options: toOptions(types) },
			{ name: 'booster', label: 'Booster type', type: 'select', required: true,
				options: toOptions(await BoosterTypeProcess.list()),
				showIf: { field: 'type', in: typeIds(/Booster/) } },
			{ name: 'rivenType', label: 'Riven type', type: 'select', required: true,
				options: toOptions(await RivenTypeProcess.list()),
				showIf: { field: 'type', in: typeIds(/Riven/) } }
		];
	},
	// current values of a record, for the edit form (null when it does not exist)
	async load(id) {
		const doc = await Reward.findById(id).lean().exec();
		if (!doc) return null;
		return {
			createdAt: doc.Created_date,
			// the update would remove the unveiled riven : these fields are not in this form
			lockedReason: doc.riven ? 'This reward is linked to an unveiled riven, it cannot be edited here.' : null,
			values: {
				date: doc.date ? date2string(doc.date) : '',
				source: idOf(doc.source),
				type: idOf(doc.type),
				booster: idOf(doc.booster),
				rivenType: idOf(doc.rivenType)
			}
		};
	},
	// values : only the validated values of the visible fields ; id : the record to update (edit form)
	save: (values, userId, id) => RewardProcess.addOrUpdate(id ? { ...values, _id: id } : values, userId)
};
