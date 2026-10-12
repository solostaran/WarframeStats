'use strict';

const mongoose = require('mongoose'),
	_ = require("lodash"),
	Reward = mongoose.model('Reward'),
	RewardTypeProcess = require('./rewardTypeProcess'),
	RivenTypeProcess = require('./rivenTypeProcess'),
	BoosterTypeProcess = require('./boosterTypeProcess'),
	NetracellProcess = require('./netracellRewardProcess'),
	Netracell = mongoose.model("NetracellReward"),
	{ netracellRewardSources } = require('../models/netracellModel');

const sortie_stats = function() {
	return new Promise( async function(resolve, reject) {
		const rewardTypes = await RewardTypeProcess.list();
		Promise.all(
			rewardTypes.map(rt => Reward.countDocuments({type: rt._id}))
		).then(results => {
			const totalCount = results.reduce((prev, current) => prev + current);
			const list = _.zipWith(rewardTypes, results, function (rt, count) { return { type: rt, count: count }; });
			resolve({ listStats: list, totalCount: totalCount});
		}).catch(err => { reject(err) });
	});
};

// count of the rewards of a reward type per sub-type (riven type, booster type), computed by the database
// rewardTypeName : the reward type ; field : the reward field of the sub-type ; listTypes : lists all the sub-types
const countBySubType = async function(rewardTypeName, field, listTypes) {
	const rewardType = await RewardTypeProcess.findByIdOrName(rewardTypeName);
	const [types, groups] = await Promise.all([
		listTypes(),
		Reward.aggregate([
			{ $match: { type: rewardType._id } },
			{ $group: { _id: '$' + field, count: { $sum: 1 } } }
		])
	]);
	const countById = new Map(groups.map(g => [String(g._id), g.count]));
	const stats = {};
	types.forEach(t => stats[t.name] = (stats[t.name] || 0) + (countById.get(String(t._id)) || 0));
	// every reward of that type, even one without a known sub-type (never a crash)
	const count = groups.reduce((total, g) => total + g.count, 0);
	return {stats: stats, count: count};
};

const riven = function() {
	return countBySubType('Riven', 'rivenType', RivenTypeProcess.list);
};

const booster = function() {
	return countBySubType('Booster', 'booster', BoosterTypeProcess.list);
};

// one statistic per netracell reward source : [{ source, listStats, totalCount }]
const netracell_stats = async function() {
	const netraType = await NetracellProcess.listTypes();
	return Promise.all(netracellRewardSources.map(source => netracell_source_stats(netraType, source)));
}

const netracell_source_stats = async function(netraType, source) {
	const results = await Promise.all(
		netraType.map(nt => Netracell.countDocuments({'reward._id': nt._id, 'source.type': source}))
	);
	const totalCount = results.reduce((prev, current) => prev + current, 0);
	const list = _.zipWith(netraType, results, function (nt, count) { return { type: nt, count: count }; });
	let finalList = {};
	list.forEach(s => {
		let stat = finalList[s.type.type];
		if (stat) {finalList[s.type.type] = stat + s.count;}
		else {finalList[s.type.type] = s.count;}
	});
	return { source: source, listStats: finalList, totalCount: totalCount };
}

exports.sortie_stats = sortie_stats;
exports.riven = riven;
exports.booster = booster;
exports.netracell_stats = netracell_stats;
