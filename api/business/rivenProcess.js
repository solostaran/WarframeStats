'use strict';

const mongoose = require('mongoose'),
    Riven = mongoose.model('Riven');

const list = function(onFound, onError) {
    Riven.find({}).then(onFound, onError);
};

const add = function(oneRiven, onSuccess, onError) {
    const newRiven = new Riven(oneRiven);
    newRiven.save().then(onSuccess).catch(onError);
};

const byId = function(id, onFound, onError) {
    Riven.findById(id).populate('type').populate('conditions').then(onFound).catch(onError);
}

const deleteOneById = function(id, onDelete, onError) {
    Riven
        .deleteOne({ '_id': id})
        .then(onDelete)
        .catch(onError);

}

const deleteAll = function(onDelete, onError) {
    Riven.collection
        .deleteMany({})
        .then(onDelete)
        .catch(onError);
}

exports.list = list;
exports.add = add;
exports.byId = byId;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;