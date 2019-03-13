'use strict';

const mongoose = require('mongoose'),
    SortieReward = mongoose.model('SortieReward'),
    rewardType = require('./rewardTypeProcess.js'),
    boosterType = require('./boosterTypeProcess.js');

const list = function(onFound, onError) {
    SortieReward.find({}).then(onFound, onError);
};

const add = function(obj, onSuccess, onError) {
    const newReward = new SortieReward(obj);
    rewardType.byIdOrName(
        obj.type,
        ret => {
            console.log("Reward Type = "+ret[0].name);
            newReward.type = ret[0]._id;
            if (ret[0].name.search(new RegExp('riven', 'i')) >= 0) {
                console.log("Add riven reward : ");
                onSuccess(newReward);
                return;
            }
            if (ret[0].name.search(new RegExp('booster', 'i')) >= 0) {
                console.log("Verify that reward is a correct booster : "+newReward.reward);
                boosterType.byId(newReward.reward,
                    () => {
                        console.log("Add booster reward");
                        newReward.save().then(onSuccess).catch(onError);
                    },
                    onError);
                return;
            }
            console.log("Add reward");
            onSuccess(newReward);
        },
        onError);

    //newReward.save().then(onSuccess).catch(onError);
};

const byId = function(id, onSuccess, onError) {
    // TODO : populate reward depending on type !!!
    SortieReward.findById(id).populate('type').then(onSuccess).catch(onError);
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
exports.deleteAll = deleteAll;