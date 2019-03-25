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

const findById = function(id, onFound, onError) {
    BoosterTypes.findById(id).then(onFound).catch(onError);
}

const findByName = function(name, onFound, onError) {
    BoosterTypes.find({name: { "$regex": name, "$options": "i" }}).then(onFound).catch(onError);
}

const findByIdOrName = function(param, onFound, onError) {
    findById(param, onFound,
        err => {
            findByName(param, ret2 => {
                if (ret2.length > 0)
                    onFound(ret2[0]);
                else
                    onError(new Error("Booster type not found : "+param));
            }, onError);
        });
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
exports.findById = findById;
exports.findByName = findByName;
exports.findByIdOrName = findByIdOrName;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;