'use strict';

const mongoose = require('mongoose');
const RivenSource = mongoose.model('RivenSource');

const list = function() {
    return RivenSource.find({}).exec();
};

const addOrUpdate = async function(obj, _id) {
    let ro;
    if (obj === null) return Promise.reject('Null object');
    if (obj._id) {
        // update existing origin
        ro = await RivenSource.findById(obj._id);
    } else {
        // create a new origin
        ro = new RivenSource();
    }
    ro.name = obj.name;
    ro.markModified('name');
    if (obj.more_info) {
        ro.more_info = obj.more_info;
        ro.markModified('more_info');
    }
    return ro.save();
};

const adds = function(listOfRivenSource, _id) {
    const options = { ordered: true, rawResult: true };
    return RivenSource.collection.insertMany(listOfRivenSource, options);
};

const findById = function(id) {
    return RivenSource.findById(id).exec();
};

const findByName = function(param) {
    return RivenSource
        .find({ name: { $regex : new RegExp(param, "i") } })
        .exec();
};

const findByIdOrName = async function(param) {
    try {
        return await findById(param);
    } catch (err) {}
    const ret = await findByName(param);
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
exports.findByIdOrName = findByIdOrName;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;
