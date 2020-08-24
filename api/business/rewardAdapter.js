'use strict';

const mongoose = require('mongoose'),
    ConvertDate = require('../utils/convertDates.js'),
    SortieReward = mongoose.model('SortieReward'),
    RewardTypeProcess = require('./rewardTypeProcess.js'),
    BoosterTypeProcess = require('./boosterTypeProcess.js'),
    RivenTypeProcess = require('./rivenTypeProcess.js');

const getRewardBooster = async function (formReward) {
    if (formReward.booster) {
        if (mongoose.Types.ObjectId.isValid(formReward.booster)) {
            return formReward.booster;
        } else {
            const boosterType = await BoosterTypeProcess.findByIdOrName(formReward.booster);
            return boosterType._id;
        }
    }
    else
        throw new Error('Type is booster but no booster provided.');
};

const getRewardRiven = async function (formReward) {

    let conds = [];
    if (formReward.rivenConditions)
        conds = formReward.rivenConditions.filter(function(cond) { return cond !== 'none'; });
    const rtype = await RivenTypeProcess.findByIdOrName(formReward.rivenType);
    const riven = {
        type: rtype._id,
        weaponName: formReward.rivenWeaponName,
        conditions: conds
    };
    if (formReward.rivenN)
        riven.N = formReward.rivenN;
    return riven;
};

const getRewardDate = function(formReward) {
    if (formReward.date)
        return ConvertDate.value2date(formReward.date);
    return null;
};


const form2reward = async function(formReward, userId) {
    let reward;
    if (formReward._id) {
        // update existing reward
        reward = await SortieReward.findById(formReward._id).exec();
        if (reward === null) {
            throw new Error('A reward id was provided but no reward found.');
        }
        reward.modifiedBy = userId;
        reward.markModified('modifiedBy');
    } else {
        // Create a new reward
        reward = new SortieReward(formReward);
        reward.createdBy = userId;
        reward.markModified('createdBy');
    }
    const rtype = await RewardTypeProcess.findByIdOrName(formReward.type);
    reward.type = rtype._id;
    reward.markModified('type');
    reward.date = getRewardDate(formReward);
    reward.markModified('date');
    if (rtype.name.search('Booster') >= 0) {
        reward.booster = await getRewardBooster(formReward);
        reward.markModified('booster');
    }
    else if (reward.booster) {
        reward.booster = null;
        reward.markModified('booster');
    }
    if (rtype.name.search('Riven') >= 0) {
        reward.riven = await getRewardRiven(formReward);
    } else if (reward.riven) {
        reward.riven = null;
    }
    reward.markModified('riven');
    //console.log(JSON.stringify(reward));
    return reward;
};

exports.form2reward = form2reward;