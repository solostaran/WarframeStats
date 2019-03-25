'use strict';

const mongoose = require('mongoose');
const RivenTypes = mongoose.model('RivenType');

const list = function(onFound, onError) {
    RivenTypes.find({}).then(onFound, onError);
};

const add = function(oneRivenType, onSuccess, onError) {
    const newRT = new RivenTypes(oneRivenType);
    newRT.save().then(onSuccess).catch(onError);
};

const adds = function(listOfRivenType, onSuccess, onError) {
    RivenTypes.collection
        .insertMany(listOfRivenType, { ordered: true, rawResult: true })
        //.save(listOfRivenType)
        .then(onSuccess)
        .catch(onError);
};

const findById = function(id, onFound, onError) {
    RivenTypes.findById(id).then(onFound).catch(onError);
}

const findByName = function(param, onFound, onError) {
    RivenTypes
        .find({ name: { $regex : new RegExp(param, "i") } })
        .then(ret => onFound(ret[0]))
        .catch(onError);
}

const findByIdOrName = function(param, onFound, onError) {
    findById(param, onFound, err => { findByName(param, onFound, onError); });
}

const deleteOneById = function(id, onDelete, onError) {
    RivenTypes
        .deleteOne({ '_id': id})
        .then(onDelete)
        .catch(onError);

}

const deleteAll = function(onDelete, onError) {
    RivenTypes.collection
        .deleteMany({})
        .then(onDelete)
        .catch(onError);
}

exports.list = list;
exports.add = add;
exports.adds = adds;
exports.findById = findById;
exports.findByIdOrName = findByIdOrName;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;