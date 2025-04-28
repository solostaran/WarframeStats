'use strict';

const mongoose = require('mongoose'),
	_ = require("lodash"),
	Netracell = mongoose.model("NetracellReward"),
	NetracellRewardType = mongoose.model("NetracellRewardType"),
	netracellModel = require('../models/netracellModel'),
	convert = require('../utils/convertDates.js');

const count = function() {
	return Netracell.countDocuments({}).exec();
};

const countByType = function(type) {
	return Netracell.countDocuments({reward: type}).exec();
};

const list_raw = async function() {
	return Netracell
		.find({})
		.populate({path:'reward', select:'type'})
		.sort({date: -1})
		.exec()
		.then(list => {
			const ret = list.map(function(n) {
				return {
					_id: n._id,
					reward: n.reward.toType(),
					tauforged: n.tauforged,
					date: n.date
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

const form2reward = async function(form, userId) {
	let netracell;
	if (form._id) {
		// update existing netracell reward
		netracell = await Netracell.findById(form._id).exec();
		if (netracell === null) throw new Error('A netracell id was provided but no netracell reward found.');
		netracell.modifiedBy = userId;
		netracell.markModified('modifiedBy');
	} else {
		// Create a new netracell
		netracell = new Netracell();
		netracell.createdBy = userId;
		netracell.markModified('createdBy');
	}
	const find_reward_value = encodeURIComponent(form.reward).replaceAll("%20", " ");
	const type = await findType(find_reward_value);
	if (type) {
		netracell.reward = type;
		netracell.markModified('reward');
	} else {
		throw new Error('Wrong netracell reward type.');
	}
	if (form.tauforged) {
		netracell.tauforged = true;
		netracell.markModified('tauforged');
	}
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
				if (netracell.createdBy) netracell.createdBy = netracell.createdBy.toInfoJSON();
				if (netracell.modifiedBy) netracell.modifiedBy = netracell.modifiedBy.toInfoJSON();
				netracell.reward = netracell.reward.toType();
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

const setTypes = function(onSuccess, onError){
	let inserted = 0;
	let rejected = 0;
	let rejects = [];
	Promise.all(
		netracellModel.netracellRewardTypes.map(type => new Promise(
			resolve => NetracellRewardType.create({type: type})
				.then(ret => { ++inserted; resolve(ret)})
				.catch(err => {
					rejects.push({reject: type, error: err});
					++rejected;
					resolve(err);
				})
			)
		)
	).then(() => {
		const result = {insertedCount: inserted , rejectedCount: rejected, rejects: rejects };
		console.log("Netracell Type insertion : "+JSON.stringify(result));
		onSuccess(result);
	}).catch(onError)
}

exports.count = count;
exports.countByType = countByType;
exports.list_raw = list_raw;
exports.addOrUpdate = addOrUpdate;
exports.adds = adds;
exports.findById = findById;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;
exports.listTypes = listTypes;
exports.setTypes = setTypes;
