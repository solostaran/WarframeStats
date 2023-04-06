const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RivenConditionSchema = new Schema({
    description: {
        type: String,
        alias: 'desc',
        required: true
    },
    Created_date: {
        type: Date,
        default: Date.now
    },
    optional: {
        type: Boolean,
        required: false
    },
    advices: {
        type: [String],
        required: false,
        default: undefined
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

module.exports = mongoose.model('RivenCondition', RivenConditionSchema);
