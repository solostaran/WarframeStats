'use strict';

const mongoose = require('mongoose'),
    convertDate = require('../utils/convertDates.js'),
    rewardType = require('./rewardTypeProcess.js'),
    boosterTypeProcess = require('./boosterTypeProcess.js'),
    rivenTypeProcess = require('./rivenTypeProcess.js');

const modifyRewardBooster = function (reward, formReward, onOk, onError) {
    if (formReward.booster) {
        if (mongoose.Types.ObjectId.isValid(formReward.booster)) {
            reward.booster = formReward.booster;
            reward.markModified('booster');
            onOk(reward);
        } else {
            boosterTypeProcess.findByIdOrName(formReward.booster,
                btype => {
                    reward.booster = btype._id;
                    onOk(reward);
                },
                onError);
        }
    }
    else
        onError(new Error('Type is booster but no booster type provided.'));
};

const modifyRewardRiven = function (reward, formReward, onOk, onError) {
    let conds = [];
    if (formReward.rivenConditions)
        conds = formReward.rivenConditions.filter(function(cond) { return cond !== 'none'; });
    const riven = {
        type: formReward.rivenType,
        weaponName: formReward.rivenWeaponName,
        conditions: conds
    };
    if (formReward.rivenN)
        riven.N = formReward.rivenN;
    reward.riven = riven;
    reward.markModified('riven');
    if (!mongoose.Types.ObjectId.isValid(reward.riven.type)) {
        rivenTypeProcess.findByIdOrName(reward.riven.type,
            rtype => {
                reward.riven.type = rtype._id;
                onOk(reward);
            },
            onError);
    } else
        onOk(reward);
};

const modifyRewardDate = function(reward, formReward, typeName, onOk, onError) {
    if (formReward.date) {
        reward.date = convertDate.value2date(formReward.date);
        reward.markModified('date');
    } else {
        reward.date = null;
        reward.markModified('date');
    }
    if (typeName.search('Booster') >= 0) {
        modifyRewardBooster(reward, formReward, onOk, onError);
        return;
    } else {
        if (reward.booster) {
            reward.booster = null;
            reward.markModified('booster');
        }
    }

    if (typeName.search('Riven') >= 0) {
        modifyRewardRiven(reward, formReward, onOk, onError);
        return;
    } else {
        if (reward.riven) {
            reward.riven = null;
            reward.markModified('riven');
        }
    }
    onOk(reward);
};


const form2reward = function(reward, formReward, onOk, onError) {

    // clarify the type
    rewardType.findByIdOrName(
        formReward.type,
    type => {
            // type is known
            reward.type = type._id;
            reward.markModified('type');
            modifyRewardDate(reward, formReward, type.name, onOk, onError)
        },
    err => onError(err)
    );
}

exports.form2reward = form2reward;