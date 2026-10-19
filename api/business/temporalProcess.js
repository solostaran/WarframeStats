'use strict';

const mongoose = require('mongoose'),
	Temporal = mongoose.model("TemporalReward"),
	TemporalRewardType = mongoose.model("TemporalRewardType"),
	TemporalRewardSource = mongoose.model("TemporalRewardSource"),
	temporalModel = require('../models/temporalModel'),
	publicUser = require('../utils/publicUser'),
	seed = require('../utils/seedTypes');

const count = function() {
	return Temporal.countDocuments({}).exec();
};

// "Azure Archon Shard (Tauforged), Omni Forma" : the loots of a run, as a text
const lootsText = function(loots) {
	return (loots || []).map(loot => loot.reward.toType() + (loot.tauforged ? ' (Tauforged)' : '')).join(', ');
};

const list_raw = async function() {
	return Temporal
		.find({})
		.sort({date: -1})
		.exec()
		.then(list => list.map(function(t) {
			return {
				_id: t._id,
				source: t.source ? t.source.toType() : undefined,
				rewards: lootsText(t.loots),
				lootCount: t.loots ? t.loots.length : 0,
				date: t.date,
				Created_date: t.Created_date
			}
		}));
}

const addOrUpdate = async function(obj, userId) {
	if (obj === null) return Promise.reject('Null object');
	return Promise.resolve(form2reward(obj, userId));
};

const adds = function(temporalArray, userId, onSuccess, onError) {
	let inserted = 0;
	let rejected = 0;
	let rejects = [];
	Promise.all(
		temporalArray.map(temporal => new Promise(
			resolve => addOrUpdate(temporal, userId)
				.then(ret => { ++inserted; resolve(ret); })
				.catch(err => {
					rejects.push({reject: temporal, error: err });
					console.log("Reject: "+JSON.stringify(temporal));
					++rejected;
					resolve(err); }))
			)
		).then(() => {
			const result = {insertedCount: inserted , rejectedCount: rejected, rejects: rejects };
			console.log("Temporal insertion : "+JSON.stringify(result)+" by User["+userId+"]");
			onSuccess(result);
		}).catch(onError);
};

// form.loots : [{ reward, tauforged }]
const form2loots = async function(form, sourceType) {
	const loots = Array.isArray(form.loots) ? form.loots : [];
	const max = temporalModel.temporalMaxLoots[sourceType];
	if (loots.length < 1 || loots.length > max)
		throw new Error('A '+sourceType+' reward has '+(max > 1 ? '1 to '+max+' loots.' : '1 loot.'));
	return Promise.all(loots.map(async loot => {
		const find_reward_value = encodeURIComponent(loot ? loot.reward : undefined).replaceAll("%20", " ");
		const type = await findType(find_reward_value);
		if (!type) throw new Error('Wrong temporal reward type.');
		// a boolean or the text 'true' (forms), for a shard only ; anything else : not tauforged
		const tauforged = (loot.tauforged === true || loot.tauforged === 'true')
			&& temporalModel.temporalTauforgeableTypes.includes(type.type);
		return tauforged ? { reward: type, tauforged: true } : { reward: type };
	}));
};

const form2reward = async function(form, userId) {
	let temporal;
	if (form._id) {
		// update existing temporal reward
		temporal = await Temporal.findById(form._id).exec();
		if (temporal === null) throw new Error('A temporal id was provided but no temporal reward found.');
		temporal.modifiedBy = userId;
		temporal.markModified('modifiedBy');
		temporal.Modified_date = new Date();
		temporal.markModified('Modified_date');
	} else {
		// Create a new temporal reward
		temporal = new Temporal();
		temporal.createdBy = userId;
		temporal.markModified('createdBy');
	}
	const find_source_value = encodeURIComponent(form.source).replaceAll("%20", " ");
	const source = await findSource(find_source_value);
	if (source) {
		temporal.source = source;
		temporal.markModified('source');
	} else {
		throw new Error('Wrong temporal reward source.');
	}
	temporal.loots = await form2loots(form, source.type);
	temporal.markModified('loots');
	if (form.date) {
		if (form.date !== temporal.date) {
			temporal.date = form.date;
			temporal.markModified('date');
		}
	}
	await temporal.save();
	return temporal;
}

const findById = async function(id) {
	return Temporal.findById(id)
		.populate('modifiedBy')
		.populate('createdBy')
		.exec()
		.then(temporal => {
			if (temporal) {
				// never the user document : this result is sent to visitors
				if (temporal.createdBy) temporal.createdBy = publicUser(temporal.createdBy);
				if (temporal.modifiedBy) temporal.modifiedBy = publicUser(temporal.modifiedBy);
			}
			return temporal || undefined;
		});
};

const deleteOneById = async function(id) {
	let temporal;
	try {
		temporal = await Temporal.findById(id);
		await temporal.deleteOne();
		return Promise.resolve(temporal);
	} catch(err) {
		return Promise.reject('Cannot find temporal whose ID = '+id)
	}
};

const deleteAll = function() {
	return Temporal
		.deleteMany({})
		.exec();
};

const listTypes = function() {
	return TemporalRewardType.find({}).exec();
}

const findType = async function(type_string) {
	return TemporalRewardType.findOne({type: type_string});
}

const listSources = function() {
	return TemporalRewardSource.find({}).exec();
}

const findSource = async function(type_string) {
	return TemporalRewardSource.findOne({type: type_string});
}

const setTypes = function(onSuccess, onError) {
	seed(TemporalRewardType, temporalModel.temporalRewardTypes, "Temporal Type", onSuccess, onError);
}

const setSources = function(onSuccess, onError) {
	seed(TemporalRewardSource, temporalModel.temporalRewardSources, "Temporal Source", onSuccess, onError);
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
