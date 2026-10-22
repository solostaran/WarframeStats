'use strict';

const mongoose = require('mongoose'),
	Reward = mongoose.model('Reward'),
	RewardTypeProcess = require('./rewardTypeProcess'),
	RivenTypeProcess = require('./rivenTypeProcess'),
	BoosterTypeProcess = require('./boosterTypeProcess'),
	Netracell = mongoose.model("NetracellReward"),
	{ netracellRewardSources, netracellRewardTypes } = require('#root/api/models/netracellModel.js'),
	Temporal = mongoose.model("TemporalReward"),
	{ temporalRewardSources, temporalRewardTypes } = require('#root/api/models/temporalModel.js');

// count of the rewards per reward type, computed by the database
const reward_stats = async function() {
	const [rewardTypes, groups] = await Promise.all([
		RewardTypeProcess.list(),
		Reward.aggregate([
			{ $group: { _id: '$type', count: { $sum: 1 } } }
		])
	]);
	const countById = new Map(groups.map(g => [String(g._id), g.count]));
	const list = rewardTypes.map(rt => ({ type: rt, count: countById.get(String(rt._id)) || 0 }));
	const totalCount = list.reduce((total, s) => total + s.count, 0);
	return { listStats: list, totalCount: totalCount };
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

// one statistic per reward source of runs with loots (netracell, temporal) : [{ source, listStats, totalCount, runCount }],
// computed by the database
// listStats : count of loots per reward type ; totalCount : count of loots ; runCount : count of runs (documents)
const lootStats = async function(Model, rewardSources, rewardTypes) {
	const [lootGroups, runGroups] = await Promise.all([
		Model.aggregate([
			{ $unwind: '$loots' },
			{ $group: { _id: { source: '$source.type', reward: '$loots.reward.type' }, count: { $sum: 1 } } }
		]),
		Model.aggregate([
			{ $group: { _id: '$source.type', count: { $sum: 1 } } }
		])
	]);
	const runsBySource = new Map(runGroups.map(g => [g._id, g.count]));
	return rewardSources.map(source => {
		const listStats = {};
		rewardTypes.forEach(type => listStats[type] = 0);
		lootGroups.filter(g => g._id.source === source && Object.hasOwn(listStats, g._id.reward))
			.forEach(g => listStats[g._id.reward] = g.count);
		const totalCount = Object.values(listStats).reduce((total, count) => total + count, 0);
		return { source: source, listStats: listStats, totalCount: totalCount, runCount: runsBySource.get(source) || 0 };
	});
};

const netracell_stats = function() {
	return lootStats(Netracell, netracellRewardSources, netracellRewardTypes);
};

const temporal_stats = function() {
	return lootStats(Temporal, temporalRewardSources, temporalRewardTypes);
};

exports.reward_stats = reward_stats;
exports.riven = riven;
exports.booster = booster;
exports.netracell_stats = netracell_stats;
exports.temporal_stats = temporal_stats;
