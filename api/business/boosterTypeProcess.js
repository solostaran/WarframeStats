'use strict';

const mongoose = require('mongoose');
const BoosterTypes = mongoose.model('BoosterType');

const list = function() {
    return BoosterTypes.find({}).exec();
};

const to_array = async function() {
    let retArray = [];
    const boosterTypes = await BoosterTypes.find({}).exec();
    for (let booster of boosterTypes) {
        retArray[booster._id] = booster.name;
    }
    return retArray;
};

const add = function(oneBoosterType) {
    const newObj = new BoosterTypes(oneBoosterType);
    return newObj.save();
};

const adds = function(listOfBoosterType) {
    return BoosterTypes.collection
        .insertMany(listOfBoosterType, { ordered: true, rawResult: true })
        //.save(listOfRivenType)
        ;
};

const update = function(boosterType) {
    return BoosterTypes.findByIdAndUpdate(boosterType._id, {name: boosterType.name, description: boosterType.description, url: boosterType.url}).exec();
}

const findById = function(id) {
    return BoosterTypes.findById(id).exec();
};

const findByName = function(name) {
    return BoosterTypes.find({name: { "$regex": name, "$options": "i" }}).exec();
};

const findByIdOrName = async function(param) {
    try {
        return await findById(param);
    } catch (err) {}
    const ret = await findByName(param);
    if (ret.length === 1)
        return ret[0];
    throw new Error('This booster type does not exists or is imprecise .'+ret.length);
};

const deleteOneById = function(id) {
    return BoosterTypes
        .deleteOne({ '_id': id})
        .exec();

};

const deleteAll = function() {
    return BoosterTypes
        .deleteMany({})
        .exec();
};

exports.list = list;
exports.to_array = to_array;
exports.add = add;
exports.adds = adds;
exports.update = update;
exports.findById = findById;
exports.findByName = findByName;
exports.findByIdOrName = findByIdOrName;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;
