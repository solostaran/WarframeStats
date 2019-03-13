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
    }]
});

module.exports = mongoose.model('Riven', RivenSchema);
