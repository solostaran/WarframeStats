const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// https://warframe.fandom.com/wiki/Sortie#Rewards
const BoosterTypeSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        alias: 'desc',
        required: true
    },
    url: {
        type: String,
        required: false
    },
},{
    versionKey: false
});

module.exports = mongoose.model('BoosterType', BoosterTypeSchema);