'use strict'

const mongoose = require('mongoose'),
    rewardType = require('./rewardTypeProcess.js'),
    sortieRewardProcess = require('./sortieRewardProcess.js'),
    SortieReward = mongoose.model('SortieReward');

const modifyReward = function(reward, formReward, typeName, onOk, onError) {
    if (formReward.date) {
        const split = formReward.date.split('/');
        const newDate = new Date(Date.UTC(split[0], split[1], split[2]));
        reward.date = newDate;
        reward.markModified('date');
    } else {
        reward.date = null;
        reward.markModified('date');
    }
    if (typeName.search('Booster') >= 0) {
        if (formReward.booster) {
            reward.booster = formReward.booster;
            reward.markModified('booster');
        }
        else
            onError(new Error('Type is booster but no booster type provided.'));
    } else {
        if (reward.booster) {
            reward.booster = null;
            reward.markModified('booster');
        }
    }
    if (typeName.search('Riven') >= 0) {
        const riven = {
            type: formReward.rivenType,
            weaponName: formReward.rivenWeaponName,
            conditions: formReward.rivenConditions.filter(function(cond) {
                return cond != 'none';
            })
        };
        reward.riven = riven;
        reward.markModified('riven');
    } else {
        if (reward.riven) {
            reward.riven = null;
            reward.markModified('riven');
        }
    }
    onOk(reward);
}


const form2reward = function(reward, formReward, onOk, onError) {
    // clarify the type
    rewardType.findByIdOrName(
        formReward.type,
    type => {
            // type is known
            reward.type = type._id;
            reward.markModified('type');
            modifyReward(reward, formReward, type.name, onOk, onError)
        },
    err => onError(err)
    );
}

exports.form2reward = form2reward;