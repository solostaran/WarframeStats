'use strict';

const mongoose = require('mongoose'),
	Riven = mongoose.model('Riven'),
	RivenAdapter = require('./rivenAdapter'),
	publicUser = require('../utils/publicUser');

const list = function() {
	return Riven.find({}).populate('type').populate('source', {'name':1}).sort({Created_date: -1}).exec();
};

const addOrUpdate = async function(oneRiven, userId) {
	const riven = await RivenAdapter.form2riven(oneRiven, userId);
	await riven.save();
	return byId(riven._id);
};

const byId = async function(id) {
	let riven;
	try {
		riven = await Riven.findById(id)
			.populate('type')
			.populate('source', {'name':1})
			//.populate('conditions')
			.populate([{path: 'conditions', model: 'RivenCondition'}])
			.populate('modifiedBy')
			.populate('createdBy')
			.exec();
		// never the user document (and never a token) : this result is sent to visitors
		if (riven.createdBy) riven.createdBy = publicUser(riven.createdBy);
		if (riven.modifiedBy) riven.modifiedBy = publicUser(riven.modifiedBy);
		return Promise.resolve(riven);
	} catch (err) {
		return Promise.reject('Cannot find riven whose ID = '+id);
	}
};

const deleteOneById = async function(id) {
	let riven;
	try {
		riven = await Riven.findById(id);
		await riven.deleteOne();
		return Promise.resolve(riven);
	} catch (err) {
		return Promise.reject('Cannot find riven whose ID = '+id);
	}
	// return Riven
	// 	.deleteOne({ '_id': id})
	// 	.exec();

};

const deleteAll = function() {
	return Riven
		.deleteMany({})
		.exec();
};

exports.list = list;
exports.addOrUpdate = addOrUpdate;
exports.byId = byId;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;
