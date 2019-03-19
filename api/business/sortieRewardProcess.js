'use strict';

const mongoose = require('mongoose'),
    _ = require("lodash"),
    SortieReward = mongoose.model('SortieReward'),
    rewardType = require('./rewardTypeProcess.js'),
    boosterType = require('./boosterTypeProcess.js'),
    rivenObj = require('./rivenProcess.js');

const list = function(onFound, onError) {
    SortieReward.find({}).populate('type').then(onFound).catch(onError);
};

const add = function(obj, onSuccess, onError) {
    const newReward = new SortieReward(obj);
    // the reward type can be referenced by either an alias or by its ID
    rewardType.byIdOrName(
        obj.type,
        ret => {
            newReward.type = ret[0]._id;
            //if (ret[0].name.search(new RegExp('riven', 'i')) >= 0) {
            if (_.includes(ret[0].name.toLowerCase(), 'riven')) {
                rivenObj.add(ret.reward,
                    riven => {
                        newReward.reward = riven._id;
                        newReward.save().then(onSuccess).catch(onError);
                    },
                    onError);
                return;
            }
            if (_.includes(ret[0].name.toLowerCase(), 'booster')) {
                boosterType.byId(newReward.reward,
                    booster => {
                        newReward.reward = booster._id;
                        newReward.save().then(onSuccess).catch(onError);
                    },
                    onError);
                return;
            }
            newReward.save().then(onSuccess).catch(onError);
        },
        onError);
};

const byId = function(id, onSuccess, onError) {
    SortieReward.findById(id).populate('type').lean().then(ret => {
        if (_.includes(ret.type.name.toLowerCase(), 'booster')) {
            boosterType.byId(ret.reward,
                booster => {
                    ret.reward = booster;
                    onSuccess(ret);
                },
                onError);
            return;
        }
        if (_.includes(ret.type.name.toLowerCase(), 'riven')) {
            rivenObj.byId(ret.reward,
                riven => {
                    ret.reward = riven;
                    onSuccess(ret);
                },
                onError);
            return;
        }
        onSuccess(ret);
    }).catch(onError);
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
exports.add = add;
exports.byId = byId;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;