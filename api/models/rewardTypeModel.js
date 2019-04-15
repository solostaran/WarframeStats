const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// https://warframe.fandom.com/wiki/Sortie#Rewards
const RewardTypeSchema = new Schema({
    name: {
        type: String,
        required: true
    }
},{
    versionKey: false
});

module.exports = mongoose.model('RewardType', RewardTypeSchema);