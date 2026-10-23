'use strict';

// v4 : Temporal Archimedea rewards (api/models/temporalModel.js).
// Seeds the temporal reward sources and types, needed by every new temporal reward
// (the same as POST /temporal/setSources and /temporal/setTypes, without duplicate).
const mongoose = require('mongoose'),
	{ temporalRewardSources, temporalRewardTypes } = require('#root/api/models/temporalModel.js');

// one document { type } per value, the existing ones kept
const upsertAll = async function(Model, types) {
	let inserted = 0;
	for (const type of types) {
		const result = await Model.updateOne({ type: type }, { $setOnInsert: { type: type } }, { upsert: true }).exec();
		inserted += result.upsertedCount;
	}
	return inserted;
};

const up = async function() {
	const sources = await upsertAll(mongoose.model('TemporalRewardSource'), temporalRewardSources);
	const types = await upsertAll(mongoose.model('TemporalRewardType'), temporalRewardTypes);
	console.log("Temporal reward sources inserted : "+sources+", types inserted : "+types);
};

module.exports = {
	version: 4,
	description: 'temporal reward sources and types',
	up: up
};
