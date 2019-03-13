const mongoose = require('mongoose');
const Schema = mongoose.Schema,
    RewardType = mongoose.model('RewardType'),
    BoosterType = mongoose.model('BoosterType'),
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
    reward : {
        type: Schema.Types.Mixed,
        required: false,
        default: undefined
    }
});

module.exports = mongoose.model('SortieReward', SortieRewardSchema);
