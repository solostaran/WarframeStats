'use strict';

const mongoose = require('mongoose'),
	_ = require("lodash"),
	Reward = mongoose.model('Reward'),
	rivenProcess = require('./rivenProcess'),
	convert = require('../utils/convertDates.js'),
	publicUser = require('../utils/publicUser'),
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

// One page of rewards, filtered and sorted by the database (server-side pagination).
// The options are already validated by the route ; dates are 'YYYY-MM-DD', compared as UTC days
// like the client-side page does (row.date.substring(0, 10)).
const list_paged = async function(options) {
	const query = {};
	if (options.type) query.type = options.type;
	if (options.source) query.source = options.source;
	if (options.booster) query.booster = options.booster;
	if (options.rivenType) query.rivenType = options.rivenType;
	if (options.none) { query.booster = null; query.rivenType = null; }
	if (options.dateLow || options.dateHigh) {
		query.date = {};
		if (options.dateLow) query.date.$gte = new Date(options.dateLow + 'T00:00:00.000Z');
		if (options.dateHigh) query.date.$lte = new Date(options.dateHigh + 'T23:59:59.999Z');
	}
	const [total, rows] = await Promise.all([
		Reward.countDocuments(query).exec(),
		Reward.find(query)
			.populate('source').populate('type').populate('booster').populate('rivenType')
			.sort({date: options.order, _id: options.order})	// _id : a stable order, no row on two pages
			.skip(options.offset)
			.limit(options.limit)
			.exec()
	]);
	return { total, rows };
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
		console.log("Rewards insertion : "+JSON.stringify(result)+" by User["+userId+"]");
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
		// never the user document (and never a token) : this result is sent to visitors
		if (reward.createdBy) reward.createdBy = publicUser(reward.createdBy);
		if (reward.modifiedBy) reward.modifiedBy = publicUser(reward.modifiedBy);
		if (reward.riven) {
			const riven = await rivenProcess.byId(reward.riven);
			reward.riven = riven;
		}
	}
	return reward;
};

const deleteOneById = async function(id) {
	let reward;
	try {
		reward = await Reward.findById(id);
		await reward.deleteOne();
		return Promise.resolve(reward);
	} catch(err) {
		return Promise.reject('Cannot find reward whose ID = '+id)
	}
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
exports.list_paged = list_paged;
exports.addOrUpdate = addOrUpdate;
exports.adds = adds;
exports.findById = findById;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;
