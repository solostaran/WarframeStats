'use strict';

const mongoose = require('mongoose'),
    _ = require("lodash"),
    SortieReward = mongoose.model('SortieReward'),
    RivenType = mongoose.model('RivenType'),
    RewardType = mongoose.model('RewardType'),
    RivenCondition = mongoose.model('RivenCondition'),
    convert = require('../utils/convertDates.js'),
    rewardType = require('./rewardTypeProcess.js'),
    boosterType = require('./boosterTypeProcess.js'),
    rivenObj = require('./rivenProcess.js'),
    rewardAdapter = require('./rewardAdapter');

const count = function(onCount) {
    SortieReward.find().estimatedDocumentCount().then(onCount);
}

const list = function(options, onFound, onError) {
    let params = {};
    if (options.dateLow || options.dateHigh) {
        params.date = {};
        if (options.dateLow) {
            const date = convert.value2date(options.dateLow);
            date.setHours(0, 0, 0);
            params.date.$gte = date;
        }
        if (options.dateHigh) {
            const date = convert.value2date(options.dateHigh);
            date.setHours(23, 59, 59);
            params.date.$lte = date;
        }
    }
    if (options && Number(options.skip) >= 0 && Number(options.limit) > 0)
        SortieReward.find(params).populate('type').sort({date: 1}).skip(options.skip).limit(options.limit).then(onFound).catch(onError);
    else
        SortieReward.find(params).populate('type').sort({date: 1}).then(onFound).catch(onError);
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
    if (obj === null) onError(new Error('Null object'));
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
        rewardAdapter.form2reward(reward, obj, reward => {
            reward.save().then(onSuccess).catch(onError);
        }, onError);
    }
};

const adds = function(listOfRewards, onSuccess, onError) {
    var inserted = 0;
    var rejected = 0;
    var rejects = new Array();
    Promise.all(
        listOfRewards.map(rform => {
            return new Promise(resolve => addOrUpdate(rform, ret => { ++inserted; resolve(ret); }, err => {
                    rejects.push({reject: rform, error: err });
                    console.log("Reject: "+JSON.stringify(rform));
                    ++rejected;
                    resolve(err); }));
        })
    ).then(() => {
        const result = {insertedCount: inserted , rejectedCount: rejected, rejects: rejects };
        console.log("Rewards insertion : "+JSON.stringify(result));
        onSuccess(result);
    }).catch(onError);
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

exports.count = count;
exports.list = list;
//exports.add = add;
exports.addOrUpdate = addOrUpdate;
exports.adds = adds;
exports.findById = findById;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;