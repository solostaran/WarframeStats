const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// https://warframe.fandom.com/wiki/Sortie#Rewards
const RewardTypeSchema = new Schema({
    description: {
        type: String,
        alias: 'desc',
        required: true
    }
});

module.exports = mongoose.model('RewardType', RewardTypeSchema);