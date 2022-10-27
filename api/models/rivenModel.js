const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RivenSchema = new Schema({
    type : {
        type: Schema.Types.ObjectId,
        ref: 'RivenType',
        required: true
    },
    weaponName : {
        type: String,
        alias: 'weapon',
        required: false
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
        default: undefined,
        required: false
    },
    Created_date: {
        type: Date,
        default: Date.now
    },
    source: {
        type: Schema.Types.ObjectId,
        ref: 'RivenSource',
        require: true
    },
    // note: {
    //     type: String,
    //     required: false
    // },
    reward: {
        type: Schema.Types.ObjectId,
        ref: 'Reward',
        require: false
    },
    createdBy : {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: true
    },
    modifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: false
    }
});

module.exports = mongoose.model('Riven', RivenSchema);
