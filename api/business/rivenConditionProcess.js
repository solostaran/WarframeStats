'use strict';

const mongoose = require('mongoose');
const RivenCondition = mongoose.model('RivenCondition');

const list = function(onFound, onError) {
    RivenCondition.find({}).then(onFound).catch(onError);
};

const formattedList = function(onFound, onError) {
    RivenCondition.find({ optional: { $not: {$exists:true}}}).then(ret1 => {
        RivenCondition.find({ optional: {$exists:true}}).then(ret2 => onFound({
            mandatories: ret1,
            optionals: ret2
        })).catch(onError);
    }).catch(onError);
};

const add = function(oneRivenCondition, onSuccess, onError) {
    const newCondition = new RivenCondition(oneRivenCondition);
    newCondition.save().then(onSuccess).catch(onError);
};

const adds = function(listOfConditions, onSuccess, onError) {
    RivenCondition.collection
        .insertMany(listOfConditions, { ordered: true, rawResult: true })
        .then(onSuccess)
        .catch(onError);
};

const byId = function(id, onFound, onError) {
    RivenCondition.findById(id).then(onFound).catch(onError);
}

const deleteOneById = function(id, onDelete, onError) {
    RivenCondition
        .deleteOne({"_id":id})
        .then(onDelete)
        .catch(onError);
}

const deleteAll = function(onDelete, onError) {
    RivenCondition.collection
        .deleteMany({})
        .then(onDelete)
        .catch(onError);
}

exports.list = list;
exports.formattedList = formattedList;
exports.add = add;
exports.adds = adds;
exports.byId = byId;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;