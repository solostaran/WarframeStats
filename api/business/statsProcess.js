'use strict';

const mongoose = require('mongoose'),
    _ = require("lodash"),
    Reward = mongoose.model('Reward'),
    RewardProcess = require('./rewardProcess'),
    RewardTypeProcess = require('./rewardTypeProcess'),
    RivenTypeProcess = require('./rivenTypeProcess'),
    BoosterTypeProcess = require('./boosterTypeProcess'),
    NetracellProcess = require('./netracellRewardProcess'),
    Netracell = mongoose.model("NetracellReward");

const sortie_stats = function() {
    return new Promise( async function(resolve, reject) {
        const rewardTypes = await RewardTypeProcess.list();
        Promise.all(
          rewardTypes.map(rt => Reward.countDocuments({type: rt._id}))
        ).then(results => {
            const totalCount = results.reduce((prev, current) => prev + current);
            const list = _.zipWith(rewardTypes, results, function (rt, count) { return { type: rt, count: count }; });
            resolve({ listStats: list, totalCount: totalCount});
        }).catch(err => { reject(err) });
    });
};

const riven = async function() {
    const rewardRiven = await RewardTypeProcess.findByIdOrName('Riven');
    const rewards = await RewardProcess.list({type: rewardRiven._id});
    const types = await RivenTypeProcess.list();
    const stats = {};
    types.forEach(rt => stats[rt['name']] = 0);
    rewards.data.forEach(reward => {
        stats[reward.rivenType.name] += 1;
    });
    return {stats: stats, count: rewards.count};
};

const booster = async function() {
    const rewardBooster = await RewardTypeProcess.findByIdOrName('Booster');
    const rewards = await RewardProcess.list({type: rewardBooster._id});
    const types = await BoosterTypeProcess.list();
    const stats = {};
    types.forEach(t => stats[t['name']] = 0);
    rewards.data.forEach(reward => { stats[reward.booster.name] += 1; });
    return {stats: stats, count: rewards.count};
};

const netracell_stats = function() {
    return new Promise( async function(resolve, reject) {
        const netraType = await NetracellProcess.listTypes();
        Promise.all(
          netraType.map(nt => Netracell.countDocuments({'reward._id': nt._id}))
        ).then(results => {
            const totalCount = results.reduce((prev, current) => prev + current);
            const list = _.zipWith(netraType, results, function (nt, count) { return { type: nt, count: count }; });
            let finalList = {};
            list.forEach(s => {
                let stat = finalList[s.type.type];
                if (stat) {finalList[s.type.type] = stat + s.count;}
                else {finalList[s.type.type] = s.count;}
            });
            resolve({ listStats: finalList, totalCount: totalCount});
        }).catch(err => { reject(err) });
    });
}

exports.sortie_stats = sortie_stats;
exports.riven = riven;
exports.booster = booster;
exports.netracell_stats = netracell_stats;
