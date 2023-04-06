'use strict';

const mongoose = require('mongoose'),
	_ = require("lodash"),
	Reward = mongoose.model('Reward'),
	rivenProcess = require('./rivenProcess'),
	convert = require('../utils/convertDates.js'),
	rewardAdapter = require('./rewardAdapter');

const count = function() {
	return Reward.countDocuments({}).exec();
};

const countByType = function(type) {
	return Reward.countDocuments({type: type}).exec();
};

const list_raw = function() {
	return Reward
		.find({})
		.populate('source').populate('type').populate('booster').populate('rivenType')
		.sort({date: -1})
		.exec();
}

const params_date = function (params, options) {
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
const list = function(options) {
	return new Promise( async function(resolve, reject) {
		let params = {};
		if (options.dateLow || options.dateHigh) params_date(params, options);
		if (options.type && options.type !== '-') params.type = options.type;
		if (_.isEmpty(params)) {
			const count = await Reward.countDocuments({}).exec();
			if (options && Number(options.skip) >= 0 && Number(options.limit) > 0)
				Reward.find(params).populate('source').populate('type').populate('booster').populate('rivenType').sort({date: 1}).skip(options.skip).limit(options.limit).then(ret => {
					resolve({data: ret, count: count});
				}).catch(err => reject(err));
			else
				Reward.find(params).populate('source').populate('type').populate('booster').populate('rivenType').sort({date: 1}).then(ret => {
					resolve({data: ret, count: count});
				}).catch(err => reject(err));
		} else {
			// NOTE: this can't work with a large amount of data
			if (options && Number(options.skip) >= 0 && Number(options.limit) > 0) {
				Reward.find(params).populate('source').populate('type').populate('booster').populate('rivenType').sort({date: 1}).then(ret => {
					resolve({data: ret.slice(options.skip, options.skip + options.limit), count: ret.length})
				}).catch(err => reject(err));
			} else {
				Reward.find(params).populate('source').populate('type').populate('booster').populate('rivenType').sort({date: 1}).then(ret => {
					resolve({data: ret, count: ret.length})
				}).catch(err => reject(err));
			}
		}
	});
};

const addOrUpdate = async function(obj, userId) {
	if (obj === null) return Promise.reject('Null object');
	return Promise.resolve(rewardAdapter.form2reward(obj, userId));
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
		.populate('createdBy').exec();
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

const deleteAll = function() {
	return Reward
		.deleteMany({})
		.exec();
};

exports.count = count;
exports.countByType = countByType;
exports.list = list;
exports.list_raw = list_raw;
exports.addOrUpdate = addOrUpdate;
exports.adds = adds;
exports.findById = findById;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;
