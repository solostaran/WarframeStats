'use strict';

const mongoose = require('mongoose'),
    _ = require("lodash"),
    SortieReward = mongoose.model('SortieReward'),
    convert = require('../utils/convertDates.js'),
    rewardAdapter = require('./rewardAdapter');

const count = function(onCount) {
    SortieReward.find().estimatedDocumentCount().then(onCount);
};

const countByType = function(type, onCount) {
    SortieReward.countDocuments({type: type}).then(onCount);
};

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
    if (options.type) {
        if (options.type !== '-') params.type = options.type;
    }
    // if (options && Number(options.skip) >= 0 && Number(options.limit) > 0) {
    //     SortieReward.find(params).populate('type').sort({date: 1}).skip(options.skip).limit(options.limit).then(onFound).catch(onError);
    // } else {
    //     SortieReward.find(params).populate('type').sort({date: 1}).then(onFound).catch(onError);
    // }
    if (_.isEmpty(params)) {
        SortieReward.find().estimatedDocumentCount().then(count => {
            if (options && Number(options.skip) >= 0 && Number(options.limit) > 0)
                SortieReward.find(params).populate('type').populate('booster').sort({date: 1}).skip(options.skip).limit(options.limit).then(list => {
                    onFound({data: list, count: count});
                }).catch(onError);
            else
                SortieReward.find(params).populate('type').populate('booster').sort({date: 1}).then(list => {
                    onFound({data: list, count: count});
                }).catch(onError);
        });
    } else {
        // NOTE: this can't work with a large amount of data
        if (options && Number(options.skip) >= 0 && Number(options.limit) > 0) {
            SortieReward.find(params).populate('type').populate('booster').sort({date: 1}).then(list => {
                onFound({data: list.slice(options.skip, options.skip + options.limit), count: list.length})
            }).catch(onError);
        } else {
            SortieReward.find(params).populate('type').populate('booster').sort({date: 1}).then(list => {
                onFound({data: list, count: list.length})
            }).catch(onError);
        }
    }
};

const addOrUpdate = async function(obj, userId) {
    if (obj === null) return Promise.reject('Null object');
    const reward = await rewardAdapter.form2reward(obj, userId);
    return reward.save();
};

const adds = function(listOfRewards, userId, onSuccess, onError) {
    let inserted = 0;
    let rejected = 0;
    let rejects = [];
    Promise.all(
        listOfRewards.map(rform => new Promise(
            resolve => addOrUpdate(rform, userId)
                .then(ret => { ++inserted; resolve(ret); })
                .catch(err => {
                    rejects.push({reject: rform, error: err });
                    console.log("Reject: "+JSON.stringify(rform));
                    ++rejected;
                    resolve(err); }))
        )
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
        .populate('modifiedBy')
        .populate('createdBy')
        .then(reward => {
            if (reward.createdBy) reward.createdBy = reward.createdBy.toAuthJSON();
            if (reward.modifiedBy) reward.modifiedBy = reward.modifiedBy.toAuthJSON();
            onSuccess(reward);
        })
        .catch(onError);
};

const deleteOneById = function(id) {
    return SortieReward
        .deleteOne({ '_id': id})
        .exec();
};

const deleteAll = function(onDelete, onError) {
    return SortieReward
        .deleteMany({})
        .exec();
};

exports.count = count;
exports.countByType = countByType;
exports.list = list;
//exports.add = add;
exports.addOrUpdate = addOrUpdate;
exports.adds = adds;
exports.findById = findById;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;
