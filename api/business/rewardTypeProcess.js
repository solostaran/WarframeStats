'use strict';

const mongoose = require('mongoose');
const RewardTypes = mongoose.model('RewardType');

const list = function() {
    return RewardTypes.find({}).exec();
};

const add = function(oneBoosterType) {
    const newObj = new RewardTypes(oneBoosterType);
    return newObj.save();
};

const adds = function(listOfBoosterType) {
    return RewardTypes.collection
        .insertMany(listOfBoosterType, { ordered: true, rawResult: true });
};

const findById = function(id) {
    return RewardTypes.findById(id).exec();
};

const findByName = function(name) {
    return RewardTypes.find({name: { "$regex": name, "$options": "i" }}).exec();
};

const findByIdOrName = async function(param) {
    try {
        return await findById(param);
    } catch (err) {}
    const ret = await findByName(param);
    if (ret.length > 0)
        return ret[0];
    throw new Error('That reward type does not exists or is imprecise. '+ret.length);
};

const deleteOneById = function(id) {
    return RewardTypes
        .deleteOne({ '_id': id})
        .exec();

};

const deleteAll = function() {
    return RewardTypes
        .deleteMany({})
        .exec();
};

exports.list = list;
exports.add = add;
exports.adds = adds;
exports.findById = findById;
exports.findByName = findByName;
exports.findByIdOrName = findByIdOrName;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;