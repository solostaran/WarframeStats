'use strict';

const mongoose = require('mongoose'),
	_ = require("lodash"),
	Reward = mongoose.model('Reward'),
	rivenProcess = require('./rivenProcess'),
	convert = require('../utils/convertDates.js'),
	rewardAdapter = require('./rewardAdapter');

const count = function(onCount) {
	Reward.find().estimatedDocumentCount().then(onCount);
};

const countByType = function(type, onCount) {
	Reward.countDocuments({type: type}).then(onCount);
};

const rawlist = function(onOk, onError) {
	Reward.find({}).populate('source').populate('type').populate('booster').populate('rivenType').sort({date: -1}).then(list => {
		onOk(list)
	}).catch(onError);
}

const list = function(options, onFound, onError) {
	let params = {};
	if (options.dateLow || options.dateHigh) {
		params.date = {};
		if (options.dateLow) {
			const date = convert.value2date(options.dateLow);
			date.setHours(0, 0, 0);
			params.date.$gte = date;
		}
		if (options.dateHigh) {
			const date = convert.value2date(options.dateHigh);
			date.setHours(23, 59, 59);
			params.date.$lte = date;
		}
	}
	if (options.type) {
		if (options.type !== '-') params.type = options.type;
	}
	// if (options && Number(options.skip) >= 0 && Number(options.limit) > 0) {
	//     Reward.find(params).populate('type').sort({date: 1}).skip(options.skip).limit(options.limit).then(onFound).catch(onError);
	// } else {
	//     Reward.find(params).populate('type').sort({date: 1}).then(onFound).catch(onError);
	// }
	if (_.isEmpty(params)) {
		Reward.find().estimatedDocumentCount().then(count => {
			if (options && Number(options.skip) >= 0 && Number(options.limit) > 0)
				Reward.find(params).populate('source').populate('type').populate('booster').populate('rivenType').sort({date: 1}).skip(options.skip).limit(options.limit).then(list => {
					onFound({data: list, count: count});
				}).catch(onError);
			else
				Reward.find(params).populate('source').populate('type').populate('booster').populate('rivenType').sort({date: 1}).then(list => {
					onFound({data: list, count: count});
				}).catch(onError);
		});
	} else {
		// NOTE: this can't work with a large amount of data
		if (options && Number(options.skip) >= 0 && Number(options.limit) > 0) {
			Reward.find(params).populate('source').populate('type').populate('booster').populate('rivenType').sort({date: 1}).then(list => {
				onFound({data: list.slice(options.skip, options.skip + options.limit), count: list.length})
			}).catch(onError);
		} else {
			Reward.find(params).populate('source').populate('type').populate('booster').populate('rivenType').sort({date: 1}).then(list => {
				onFound({data: list, count: list.length})
			}).catch(onError);
		}
	}
};

const addOrUpdate = async function(obj, userId) {
	if (obj === null) return Promise.reject('Null object');
	const reward = Promise.resolve(rewardAdapter.form2reward(obj, userId));
	return reward;
};

const adds = function(listOfRewards, userId, onSuccess, onError) {
	let inserted = 0;
	let rejected = 0;
	let rejects = [];
	Promise.all(
		listOfRewards.map(rform => new Promise(
			resolve => addOrUpdate(rform, userId)
				.then(ret => { ++inserted; resolve(ret); })
				.catch(err => {
					rejects.push({reject: rform, error: err });
					console.log("Reject: "+JSON.stringify(rform));
					++rejected;
					resolve(err); }))
		)
	).then(() => {
		const result = {insertedCount: inserted , rejectedCount: rejected, rejects: rejects };
		console.log("Rewards insertion : "+JSON.stringify(result));
		onSuccess(result);
	}).catch(onError);
};

const findById = async function(id) {
	const reward = await Reward.findById(id)
		.populate('source')
		.populate('type')
		.populate('booster')
		.populate('rivenType')
		//.populate('riven') // doesn't work well
		.populate('modifiedBy')
		.populate('createdBy')
	if (reward) {
		if (reward.createdBy) reward.createdBy = reward.createdBy.toAuthJSON();
		if (reward.modifiedBy) reward.modifiedBy = reward.modifiedBy.toAuthJSON();
	}
	if (reward.riven) {
		const riven = await rivenProcess.byId(reward.riven);
		reward.riven = riven;
	}
	return reward;
};

const deleteOneById = function(id) {
	return Reward
		.deleteOne({ '_id': id})
		.exec();
};

const deleteAll = function(onDelete, onError) {
	return Reward
		.deleteMany({})
		.exec();
};

exports.count = count;
exports.countByType = countByType;
exports.list = list;
exports.rawlist = rawlist;
//exports.add = add;
exports.addOrUpdate = addOrUpdate;
exports.adds = adds;
exports.findById = findById;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;
