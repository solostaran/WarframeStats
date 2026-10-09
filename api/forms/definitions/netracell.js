'use strict';

const mongoose = require('mongoose'),
	{ netracellRewardTypes, netracellRewardSources } = require('../../models/netracellModel'),
	{ date2string } = require('../../utils/convertDates'),
	NetracellRewardProcess = require('../../business/netracellRewardProcess');

const Netracell = mongoose.model('NetracellReward');

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
			{ name: 'reward', label: 'Reward', type: 'select', required: true,
				options: netracellRewardTypes.map(type => ({ value: type, label: type })) },
			// only shards can be tauforged
			{ name: 'tauforged', label: 'Tauforged', type: 'select', required: true,
				options: [{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }],
				showIf: { field: 'reward', in: netracellRewardTypes.filter(type => type.includes('Shard')) } },
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
				reward: doc.reward && doc.reward.type ? doc.reward.type : '',
				tauforged: doc.tauforged ? 'true' : 'false',
				date: doc.date ? date2string(doc.date) : ''
			}
		};
	},
	// id : the record to update (edit form)
	save: (values, userId, id) => NetracellRewardProcess.addOrUpdate({
		...(id ? { _id: id } : {}),
		source: values.source,
		reward: values.reward,
		date: values.date,
		tauforged: values.tauforged === 'true'
	}, userId)
};
