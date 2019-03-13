'use strict';

const mongoose = require('mongoose');
const BoosterTypes = mongoose.model('BoosterType');

const list = function(onFound, onError) {
    BoosterTypes.find({}).then(onFound, onError);
};

const add = function(oneBoosterType, onSuccess, onError) {
    const newObj = new BoosterTypes(oneBoosterType);
    newObj.save().then(onSuccess).catch(onError);
};

const adds = function(listOfBoosterType, onSuccess, onError) {
    BoosterTypes.collection
        .insertMany(listOfBoosterType, { ordered: true, rawResult: true })
        //.save(listOfRivenType)
        .then(onSuccess)
        .catch(onError);
};

const byId = function(id, onFound, onError) {
    BoosterTypes.findById(id).then(onFound).catch(onError);
}

const deleteOneById = function(id, onDelete, onError) {
    BoosterTypes
        .deleteOne({ '_id': id})
        .then(onDelete)
        .catch(onError);

}

const deleteAll = function(onDelete, onError) {
    BoosterTypes.collection
        .deleteMany({})
        .then(onDelete)
        .catch(onError);
}

exports.list = list;
exports.add = add;
exports.adds = adds;
exports.byId = byId;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;