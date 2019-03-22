'use strict';

const mongoose = require('mongoose'),
    _ = require("lodash"),
    SortieReward = mongoose.model('SortieReward'),
    RivenType = mongoose.model('RivenType'),
    RivenCondition = mongoose.model('RivenCondition'),
    rewardType = require('./rewardTypeProcess.js'),
    boosterType = require('./boosterTypeProcess.js'),
    rivenObj = require('./rivenProcess.js'),
    rewardAdapter = require('./rewardAdapter');

const list = function(onFound, onError) {
    SortieReward.find({}).populate('type').sort({date: 1}).then(onFound).catch(onError);
};

// const add = function(obj, onSuccess, onError) {
//     let newReward = new SortieReward(obj);
//     // the reward type can be referenced by either an alias or by its ID
//     rewardType.findByIdOrName(
//         obj.type,
//         ret => {
//             newReward.type = ret._id;
//             newReward.save().then(onSuccess).catch(onError);
//         },
//         onError);
// };

const addOrUpdate = function(obj, onSuccess, onError) {
    if (obj._id) {
        SortieReward.findById(obj._id).then(
            reward => {
                rewardAdapter.form2reward(reward, obj, ret => {
                    ret.save().then(onSuccess).catch(onError);
                }, onError);
            }
        ).catch(onError);
    } else {
        const reward = new SortieReward(obj);
        rewardAdapter.form2reward(reward, obj, ret => {
            ret.save().then(onSuccess).catch(onError);
        }, onError);
    }
};

const findById = function(id, onSuccess, onError) {
    SortieReward.findById(id)
        .populate('type')
        .populate({path: 'riven.type', model: 'RivenType'})
        .populate([{path: 'riven.conditions', model: 'RivenCondition'}])
        .populate('booster')
        .then(onSuccess)
        .catch(onError);
}

const deleteOneById = function(id, onDelete, onError) {
    SortieReward.deleteOne({ '_id': id}).then(onDelete).catch(onError);
}

const deleteAll = function(onDelete, onError) {
    SortieReward.collection
        .deleteMany({})
        .then(onDelete)
        .catch(onError);
}

exports.list = list;
//exports.add = add;
exports.addOrUpdate = addOrUpdate;
exports.findById = findById;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;