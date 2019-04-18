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

const findById = function(id, onFound, onError) {
    RewardTypes.findById(id).then(onFound).catch(onError);
};

const findByName = function(name, onFound, onError) {
    RewardTypes.find({name: { "$regex": name, "$options": "i" }}).then(onFound).catch(onError);
};

const findByIdOrName = function(param, onFound, onError) {
    findById(param, onFound,
        () => {
            findByName(param, ret2 => {
                if (ret2.length > 0)
                    onFound(ret2[0]);
                else
                    onError(new Error("Reward type not found : "+param));
            }, onError);
        });
};

const deleteOneById = function(id, onDelete, onError) {
    RewardTypes
        .deleteOne({ '_id': id})
        .then(onDelete)
        .catch(onError);

};

const deleteAll = function(onDelete, onError) {
    RewardTypes.collection
        .deleteMany({})
        .then(onDelete)
        .catch(onError);
};

exports.list = list;
exports.add = add;
exports.adds = adds;
exports.findById = findById;
exports.findByName = findByName;
exports.findByIdOrName = findByIdOrName;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;