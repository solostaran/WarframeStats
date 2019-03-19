const mongoose = require('mongoose');
const Schema = mongoose.Schema,
    RewardType = mongoose.model('RewardType'),
    BoosterType = mongoose.model('BoosterType'),
    RivenCondition = mongoose.model('RivenCondition'),
    Riven = mongoose.model('Riven');

const SortieRewardSchema = new Schema({
    type : {
        type: Schema.Types.ObjectId,
        ref: 'RewardType',
        required: true
    },
    Created_date: {
        type: Date,
        default: Date.now
    },
    date : {
        type: Date,
        required: false
    },
    booster : {
        type: Schema.Types.ObjectId,
        ref: 'BoosterType',
        required: false,
        default: undefined
    },
    riven : {
        type : {
            rivenType: {
                type: Schema.Types.ObjectId,
                ref: 'RivenType',
                required: true
            },
            weaponName: {
                type: String,
                alias: 'weapon',
                required: true
            },
            conditions: [{
                type: Schema.Types.ObjectId,
                ref: 'RivenCondition',
                alias: 'cond',
                required: false,
                default: undefined
            }]
        },
        required: false
    }
});

module.exports = mongoose.model('SortieReward', SortieRewardSchema);
