'use strict';

const mongoose = require('mongoose'),
    _ = require("lodash"),
    Reward = mongoose.model('Reward'),
    RewardProcess = require('./rewardProcess'),
    RewardTypeProcess = require('./rewardTypeProcess'),
    RivenTypeProcess = require('./rivenTypeProcess'),
    BoosterTypeProcess = require('./boosterTypeProcess');

const global = async function(onCompleted, onError) {
    const rewardTypes = await RewardTypeProcess.list();
    Promise.all(
        rewardTypes.map(rt => Reward.countDocuments({type: rt._id}))
    ).then(results => {
        const totalCount = results.reduce((prev, current) => prev + current);
        const list = _.zipWith(rewardTypes, results, function (rt, count) {
            return { type: rt, count: count };
        });
        onCompleted({ listStats: list, totalCount: totalCount});
    }).catch(onError);
};

const riven = async function(onCompleted, onError) {
    const rewardRiven = await RewardTypeProcess.findByIdOrName('Riven');
    const rewards = await Reward.find({type: rewardRiven._id});
    const types = await RivenTypeProcess.list();
    const typeMap = {};
    types.map(rt => typeMap[rt._id] = rt);
    const stats = {};
    for (const reward of rewards) {
        if (_.isNil(stats[typeMap[reward.rivenType].name]))
            stats[typeMap[reward.rivenType].name] = 1;
        else
            stats[typeMap[reward.rivenType].name] += 1;
    }
    return {stats: stats, count: rewards.length};
};

const booster = async function(onCompleted, onError) {
    const rewardBooster = await RewardTypeProcess.findByIdOrName('Booster');
    const rewards = await new Promise(callback => RewardProcess.list({type: rewardBooster._id}, callback, onError));
    const types = await BoosterTypeProcess.list();
    const stats = {};
    //const typeMap = {};
    //types.map(bt => typeMap[bt._id] = bt);
    types.forEach(t => stats[t.name] = 0);
    rewards.data.forEach(reward => {
        // if (_.isNil(stats[typeMap[reward.booster].name]))
        //     stats[typeMap[reward.booster].name] = 1;
        // else
        //     stats[typeMap[reward.booster._id].name] += 1;
            stats[reward.booster.name] += 1;
        });
    return {stats: stats, count: rewards.count};
};

exports.global = global;
exports.riven = riven;
exports.booster = booster;
