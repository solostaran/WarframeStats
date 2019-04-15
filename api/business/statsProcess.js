'use strict';

const mongoose = require('mongoose'),
    _ = require("lodash"),
    SortieReward = mongoose.model('SortieReward'),
    SortieRewardProcess = require('./sortieRewardProcess'),
    RewardTypeProcess = require('./rewardTypeProcess'),
    RivenTypeProcess = require('./rivenTypeProcess'),
    BoosterTypeProcess = require('./boosterTypeProcess');

const general = function(onCompleted, onError) {
    RewardTypeProcess.list(rewardTypes => {
        Promise.all(
            rewardTypes.map(rt => SortieReward.countDocuments({type: rt._id}))
        ).then(results => {
            const totalCount = results.reduce((prev, current) => prev + current);
            const list = _.zipWith(rewardTypes, results, function (rt, count) {
                return { type: rt, count: count };
            });
            onCompleted({ listStats: list, totalCount: totalCount});
        }).catch(err => console.log(err));
    });
};

const riven = async function(onCompleted, onError) {
    try {
        const rewardRiven = await new Promise(callback => RewardTypeProcess.findByIdOrName('Riven', callback));
        const rewards = await new Promise(callback => SortieRewardProcess.list({type: rewardRiven._id}, callback));
        const types = await new Promise(RivenTypeProcess.list);
        const typeMap = {};
        types.map(rt => typeMap[rt._id] = rt);
        const stats = {};
        rewards.data.forEach(reward => {
            if (_.isNil(stats[typeMap[reward.riven.type].name]))
                stats[typeMap[reward.riven.type].name] = 1;
            else
                stats[typeMap[reward.riven.type].name] += 1;
        });
        onCompleted({stats: stats, count: rewards.count});
    } catch(err) {
        onError(err);
    }
};

const booster = async function(onCompleted, onError) {
    try {
        const rewardBooster = await new Promise(callback => RewardTypeProcess.findByIdOrName('Booster', callback));
        const rewards = await new Promise(callback => SortieRewardProcess.list({type: rewardBooster._id}, callback));
        const types = await new Promise(BoosterTypeProcess.list);
        const typeMap = {};
        types.map(bt => typeMap[bt._id] = bt);
        const stats = {};
        rewards.data.forEach(reward => {
            if (_.isNil(stats[typeMap[reward.booster].name]))
                stats[typeMap[reward.booster].name] = 1;
            else
                stats[typeMap[reward.booster].name] += 1;
        });
        onCompleted({stats: stats, count: rewards.count});
    } catch (err) {
        onError(err);
    }
};

exports.general = general;
exports.riven = riven;
exports.booster = booster;