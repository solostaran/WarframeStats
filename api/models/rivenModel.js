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
    },
    Created_date: {
        type: Date,
        default: Date.now
    },
    note: {
        type: String,
        required: true
    },
    createdBy : {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: false
    },
    modifiedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Users',
        required: false
    }
});

module.exports = mongoose.model('Riven', RivenSchema);
