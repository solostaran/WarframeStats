'use strict';

const mongoose = require('mongoose'),
    _ = require("lodash"),
    SortieReward = mongoose.model('SortieReward'),
    sortieRewardProcess = require('./sortieRewardProcess'),
    rewardType = require('./rewardTypeProcess'),
    rivenType = require('./rivenTypeProcess'),
    boosterType = require('./boosterTypeProcess');

const general = function(onCompleted, onError) {
    rewardType.list(rewardTypes => {
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
        const rewardRiven = await new Promise(callback => rewardType.findByIdOrName('Riven', callback));
        const rewards = await new Promise(callback => sortieRewardProcess.list({type: rewardRiven._id}, callback));
        const types = await new Promise(rivenType.list);
        const typeMap = {};
        types.map(rt => typeMap[rt._id] = rt);
        const stats = {};
        rewards.data.forEach(reward => {
            if (_.isNil(stats[typeMap[reward.riven.type].name]))
                stats[typeMap[reward.riven.type].name] = 1
            else
                stats[typeMap[reward.riven.type].name] += 1
        });
        onCompleted({stats: stats, count: rewards.count});
    } catch(err) {
        onError(err);
    }
};

const booster = function(onCompleted, onError) {
    onCompleted(null);
};

exports.general = general;
exports.riven = riven;
exports.booster = booster;