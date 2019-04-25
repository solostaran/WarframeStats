'use strict';

const mongoose = require('mongoose');
const BoosterTypes = mongoose.model('BoosterType');

const list = function() {
    return BoosterTypes.find({}).exec();
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
exports.add = add;
exports.adds = adds;
exports.findById = findById;
exports.findByName = findByName;
exports.findByIdOrName = findByIdOrName;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;