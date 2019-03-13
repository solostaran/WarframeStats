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
    }
}, {
    versionKey: false
});

// Without the following code, advices will be created to [] even if there is no advice.
// But I would like it to be 'undefined'
// Workaround: add 'default: undefined' in the Schema

// RivenConditionSchema.pre('save', function (next) {
//     if (this.isNew && 0 === this.advices.length) {
//         this.advices = undefined;
//     }
//     next();
// });

module.exports = mongoose.model('RivenCondition', RivenConditionSchema);