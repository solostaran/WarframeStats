'use strict';

// v2 : a netracell reward has a source ("Netracell" or "Deep Archimedea").
// Seeds the sources, then every existing reward comes from a Netracell.
const mongoose = require('mongoose'),
	{ netracellRewardSources } = require('../models/netracellModel');

const up = async function() {
	const Netracell = mongoose.model('NetracellReward');
	const NetracellRewardSource = mongoose.model('NetracellRewardSource');
	for (const type of netracellRewardSources) {
		await NetracellRewardSource.updateOne({ type: type }, { $setOnInsert: { type: type } }, { upsert: true }).exec();
	}
	const source = await NetracellRewardSource.findOne({ type: 'Netracell' }).exec();
	const result = await Netracell.updateMany(
		{ source: { $exists: false } },
		{ $set: { source: { _id: source._id, type: source.type } } }
	).exec();
	console.log("Netracell rewards with the source 'Netracell' : "+result.modifiedCount);
};

module.exports = {
	version: 2,
	description: 'source of the netracell rewards',
	up: up
};
