'use strict';

const mongoose = require('mongoose'),
	{ netracellRewardTypes, netracellRewardSources, netracellTauforgeableTypes } = require('#root/api/models/netracellModel.js'),
	{ date2string } = require('#root/api/utils/convertDates.js'),
	NetracellRewardProcess = require('#root/api/business/netracellRewardProcess.js');

const Netracell = mongoose.model('NetracellReward');

// field names of the loots of a run : 'reward', 'tauforged', then 'reward2', 'tauforged2'...
const LOOT_FIELDS = [1, 2, 3].map(n => {
	const suffix = n === 1 ? '' : String(n);
	return { reward: 'reward' + suffix, tauforged: 'tauforged' + suffix };
});

module.exports = {
	id: 'netracell',
	title: 'Add a netracell reward',
	submitLabel: 'Add netracell',
	editTitle: 'Edit a netracell reward',
	editSubmitLabel: 'Update',
	async fields() {
		return [
			{ name: 'source', label: 'Source', type: 'select', required: true,
				options: netracellRewardSources.map(source => ({ value: source, label: source })) },
			// 1 loot for a Netracell ; up to 3 for a Deep Archimedea, the third one after the second one
			...LOOT_FIELDS.flatMap((loot, index) => [
				{ name: loot.reward, label: index === 0 ? 'Reward' : 'Reward ' + (index + 1), type: 'select', required: index === 0,
					options: netracellRewardTypes.map(type => ({ value: type, label: type })),
					...(index === 1 ? { showIf: { field: 'source', in: ['Deep Archimedea'] } } : {}),
					...(index === 2 ? { showIf: { field: LOOT_FIELDS[1].reward, notEmpty: true } } : {}) },
				{ name: loot.tauforged, label: 'Tauforged', type: 'select', required: true,
					options: [{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }],
					showIf: { field: loot.reward, in: netracellTauforgeableTypes } }
			]),
			{ name: 'date', label: 'Date', type: 'date', required: true }
		];
	},
	// current values of a record, for the edit form (null when it does not exist)
	async load(id) {
		const doc = await Netracell.findById(id).lean().exec();
		if (!doc) return null;
		return {
			createdAt: doc.Created_date,
			lockedReason: null,
			values: {
				source: doc.source && doc.source.type ? doc.source.type : '',
				...Object.fromEntries(LOOT_FIELDS.flatMap((fields, index) => {
					const loot = (doc.loots || [])[index];
					return [
						[fields.reward, loot && loot.reward ? loot.reward.type : ''],
						[fields.tauforged, loot && loot.tauforged ? 'true' : 'false']
					];
				})),
				date: doc.date ? date2string(doc.date) : ''
			}
		};
	},
	// id : the record to update (edit form)
	save: (values, userId, id) => NetracellRewardProcess.addOrUpdate({
		...(id ? { _id: id } : {}),
		source: values.source,
		date: values.date,
		// the visible loot fields only (validated by the form engine)
		loots: LOOT_FIELDS.filter(fields => values[fields.reward])
			.map(fields => ({ reward: values[fields.reward], tauforged: values[fields.tauforged] === 'true' }))
	}, userId)
};
