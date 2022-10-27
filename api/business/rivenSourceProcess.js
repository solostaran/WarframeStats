'use strict';

const mongoose = require('mongoose');
const RivenSource = mongoose.model('RivenSource');

const list = function() {
    return RivenSource.find({}).exec();
};

const addOrUpdate = async function(obj) {
    let ro;
    if (obj === null) return Promise.reject('Null object');
    if (obj._id) {
        // update existing origin
        ro = await RivenSource.findById(obj._id);
    } else {
        // create a new origin
        ro = new RivenSource();
    }
    ro.source = obj.source;
    ro.markModified('source');
    if (obj.more_info) {
        ro.more_info = obj.more_info;
        ro.markModified('more_info');
    }
    return ro.save();
};

const adds = function(listOfRivenSource) {
    const options = { ordered: true, rawResult: true };
    return RivenSource.collection.insertMany(listOfRivenSource, options);
};

const findById = function(id) {
    return RivenSource.findById(id).exec();
};

const findBySource = function(param) {
    return RivenSource
        .find({ source: { $regex : new RegExp(param, "i") } })
        .exec();
};

const findByIdOrSource = async function(param) {
    try {
        return await findById(param);
    } catch (err) {}
    const ret = await findBySource(param);
    if (ret.length === 1)
        return ret[0];
    return null;
};

const deleteOneById = function(id) {
    return RivenSource
        .deleteOne({ '_id': id})
        .exec();

};

const deleteAll = function() {
    return RivenSource
        .deleteMany({})
        .exec();
};

exports.list = list;
exports.addOrUpdate = addOrUpdate;
exports.adds = adds;
exports.findById = findById;
exports.findByIdOrOrigin = findByIdOrSource;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;
