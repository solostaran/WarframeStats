const mongoose = require('mongoose');
const Schema = mongoose.Schema,
    RivenType = mongoose.model('RivenType'),
    RivenCondition = mongoose.model('RivenCondition');

const RivenSchema = new Schema({
    type : {
        type: Schema.Types.ObjectId,
        ref: 'RivenType',
        required: true
    },
    weaponName : {
        type: String,
        alias: 'weapon',
        required: true
    },
    conditions : [{
        type: Schema.Types.ObjectId,
        ref: 'RivenCondition',
        alias: 'cond',
        required: false,
        default: undefined
    }],
    N: {
        type: Number,
        alias: 'conditionVariable',
        min: 0,
        default: 0,
        required: false
    }
});

module.exports = mongoose.model('Riven', RivenSchema);
