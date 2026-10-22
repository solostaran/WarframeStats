'use strict';

const mongoose = require('mongoose'),
	_ = require("lodash"),
	Netracell = mongoose.model("NetracellReward"),
	NetracellRewardType = mongoose.model("NetracellRewardType"),
	NetracellRewardSource = mongoose.model("NetracellRewardSource"),
	netracellModel = require('#root/api/models/netracellModel.js'),
	{ publicUser } = require('#root/security/obfuscation.js'),
	seed = require('./seedTypes.js');

const count = function() {
	return Netracell.countDocuments({}).exec();
};

// "Azure Archon Shard (Tauforged), Melee Duplicate" : the loots of a run, as a text
const lootsText = function(loots) {
	return (loots || []).map(loot => loot.reward.toType() + (loot.tauforged ? ' (Tauforged)' : '')).join(', ');
};

const list_raw = async function() {
	return Netracell
		.find({})
		.sort({date: -1})
		.exec()
		.then(list => {
			const ret = list.map(function(n) {
				return {
					_id: n._id,
					source: n.source ? n.source.toType() : undefined,
					rewards: lootsText(n.loots),
					lootCount: n.loots ? n.loots.length : 0,
					date: n.date,
					Created_date: n.Created_date
				}
			});
			return Promise.resolve(ret);
		});
}

const addOrUpdate = async function(obj, userId) {
	if (obj === null) return Promise.reject('Null object');
	return Promise.resolve(form2reward(obj, userId));
};

const adds = function(netArray, userId, onSuccess, onError) {
	let inserted = 0;
	let rejected = 0;
	let rejects = [];
	Promise.all(
		netArray.map(netracell => new Promise(
			resolve => addOrUpdate(netracell, userId)
				.then(ret => { ++inserted; resolve(ret); })
				.catch(err => {
					rejects.push({reject: netracell, error: err });
					console.log("Reject: "+JSON.stringify(netracell));
					++rejected;
					resolve(err); }))
			)
		).then(() => {
			const result = {insertedCount: inserted , rejectedCount: rejected, rejects: rejects };
			console.log("Netracell insertion : "+JSON.stringify(result)+" by User["+userId+"]");
			onSuccess(result);
		}).catch(onError);
};

// form.loots : [{ reward, tauforged }] ; without loots, form.reward and form.tauforged are the single loot (former API)
const form2loots = async function(form, sourceType) {
	const loots = Array.isArray(form.loots) ? form.loots
		: (form.reward !== undefined ? [{ reward: form.reward, tauforged: form.tauforged }] : []);
	const max = netracellModel.netracellMaxLoots[sourceType];
	if (loots.length < 1 || loots.length > max)
		throw new Error('A '+sourceType+' reward has '+(max > 1 ? '1 to '+max+' loots.' : '1 loot.'));
	return Promise.all(loots.map(async loot => {
		const find_reward_value = encodeURIComponent(loot ? loot.reward : undefined).replaceAll("%20", " ");
		const type = await findType(find_reward_value);
		if (!type) throw new Error('Wrong netracell reward type.');
		// a boolean or the text 'true' (forms), for a shard only ; anything else : not tauforged
		const tauforged = (loot.tauforged === true || loot.tauforged === 'true')
			&& netracellModel.netracellTauforgeableTypes.includes(type.type);
		return tauforged ? { reward: type, tauforged: true } : { reward: type };
	}));
};

const form2reward = async function(form, userId) {
	let netracell;
	if (form._id) {
		// update existing netracell reward
		netracell = await Netracell.findById(form._id).exec();
		if (netracell === null) throw new Error('A netracell id was provided but no netracell reward found.');
		netracell.modifiedBy = userId;
		netracell.markModified('modifiedBy');
		netracell.Modified_date = new Date();
		netracell.markModified('Modified_date');
	} else {
		// Create a new netracell
		netracell = new Netracell();
		netracell.createdBy = userId;
		netracell.markModified('createdBy');
	}
	const find_source_value = encodeURIComponent(form.source).replaceAll("%20", " ");
	const source = await findSource(find_source_value);
	if (source) {
		netracell.source = source;
		netracell.markModified('source');
	} else {
		throw new Error('Wrong netracell reward source.');
	}
	netracell.loots = await form2loots(form, source.type);
	netracell.markModified('loots');
	if (form.date) {
		if (form.date !== netracell.date) {
			netracell.date = form.date;
			netracell.markModified('date');
		}
	}
	await netracell.save();
	return netracell;
}

const findById = async function(id) {
	return Netracell.findById(id)
		.populate('modifiedBy')
		.populate('createdBy')
		.exec()
		.then(netracell => {
			if (netracell) {
				// never the user document : this result is sent to visitors
				if (netracell.createdBy) netracell.createdBy = publicUser(netracell.createdBy);
				if (netracell.modifiedBy) netracell.modifiedBy = publicUser(netracell.modifiedBy);
				return Promise.resolve(netracell);
			}
			return Promise.resolve();
		})
		.catch(err => {
			return Promise.reject(err);
		})
};

const deleteOneById = async function(id) {
	let netracell;
	try {
		netracell = await Netracell.findById(id);
		await netracell.deleteOne();
		return Promise.resolve(netracell);
	} catch(err) {
		return Promise.reject('Cannot find netracell whose ID = '+id)
	}
};

const deleteAll = function() {
	return Netracell
		.deleteMany({})
		.exec();
};

const listTypes = function() {
	return NetracellRewardType.find({}).exec();
}

const findType = async function(type_string) {
	return NetracellRewardType.findOne({type: type_string});
}

const listSources = function() {
	return NetracellRewardSource.find({}).exec();
}

const findSource = async function(type_string) {
	return NetracellRewardSource.findOne({type: type_string});
}

const setTypes = function(onSuccess, onError) {
	seed(NetracellRewardType, netracellModel.netracellRewardTypes, "Netracell Type", onSuccess, onError);
}

const setSources = function(onSuccess, onError) {
	seed(NetracellRewardSource, netracellModel.netracellRewardSources, "Netracell Source", onSuccess, onError);
}

exports.count = count;
exports.list_raw = list_raw;
exports.addOrUpdate = addOrUpdate;
exports.adds = adds;
exports.findById = findById;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;
exports.listTypes = listTypes;
exports.setTypes = setTypes;
exports.listSources = listSources;
exports.setSources = setSources;
