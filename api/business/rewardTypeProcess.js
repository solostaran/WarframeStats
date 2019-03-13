'use strict';

const mongoose = require('mongoose');
const RewardTypes = mongoose.model('RewardType');

const list = function(onFound, onError) {
    RewardTypes.find({}).then(onFound, onError);
};

const add = function(oneBoosterType, onSuccess, onError) {
    const newObj = new RewardTypes(oneBoosterType);
    newObj.save().then(onSuccess).catch(onError);
};

const adds = function(listOfBoosterType, onSuccess, onError) {
    RewardTypes.collection
        .insertMany(listOfBoosterType, { ordered: true, rawResult: true })
        //.save(listOfRivenType)
        .then(onSuccess)
        .catch(onError);
};

const byId = function(id, onFound, onError) {
    RewardTypes.findById(id).then(onFound).catch(onError);
}

const byName = function(name, onFound, onError) {
    RewardTypes.find({name: { "$regex": name, "$options": "i" }}).then(onFound).catch(onError);
}

const byIdOrName = function(param, onFound, onError) {
    byId(param, onFound, err => { byName(param, onFound, onError); });
}

const deleteOneById = function(id, onDelete, onError) {
    RewardTypes
        .deleteOne({ '_id': id})
        .then(onDelete)
        .catch(onError);

}

const deleteAll = function(onDelete, onError) {
    RewardTypes.collection
        .deleteMany({})
        .then(onDelete)
        .catch(onError);
}

exports.list = list;
exports.add = add;
exports.adds = adds;
exports.byId = byId;
exports.byName = byName;
exports.byIdOrName = byIdOrName;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;