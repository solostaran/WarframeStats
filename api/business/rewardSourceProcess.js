'use strict';

const mongoose = require('mongoose');
const RewardSource = mongoose.model('RewardSource');

const list = function() {
    return RewardSource.find({}).exec();
};

const addOrUpdate = async function(obj) {
    let rs;
    if (obj === null) return Promise.reject('Null object');
    if (obj._id) {
        // update existing origin
        rs = await RewardSource.findById(obj._id);
    } else {
        // create a new origin
        rs = new RewardSource(obj);
    }
    rs.name = obj.name;
    rs.markModified('name');
    return rs.save();
};

const adds = function(listOfRewardSource) {
    const options = { ordered: true, rawResult: true };
    return RewardSource.collection.insertMany(listOfRewardSource, options);
};

const findById = function(id) {
    return RewardSource.findById(id).exec();
};

const findByName = function(param) {
    return RewardSource
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
    return RewardSource
        .deleteOne({ '_id': id})
        .exec();

};

const deleteAll = function() {
    return RewardSource
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
