'use strict';

const mongoose = require('mongoose');
const RivenTypes = mongoose.model('RivenType');

const list = function() {
    return RivenTypes.find({}).exec();
};

const add = function(oneRivenType) {
    const newRT = new RivenTypes(oneRivenType);
    return newRT.save();
};

const adds = function(listOfRivenType) {
    return RivenTypes.collection
        .insertMany(listOfRivenType, { ordered: true, rawResult: true });
};

const findById = function(id) {
    return RivenTypes.findById(id).exec();
};

const findByName = function(param) {
    return RivenTypes
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
    return RivenTypes
        .deleteOne({ '_id': id})
        .exec();

};

const deleteAll = function() {
    return RivenTypes
        .deleteMany({})
        .exec();
};

exports.list = list;
exports.add = add;
exports.adds = adds;
exports.findById = findById;
exports.findByIdOrName = findByIdOrName;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;