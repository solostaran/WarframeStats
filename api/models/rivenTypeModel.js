const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RivenTypeSchema = new Schema({
    name : {
        type: String,
        required: [true, 'Name is required']
        // validate: [{
        //     validator: function(value) {
        //         if(!this.local) return true;
        //         return value;
        //     },
        //     message: 'Name is required'
        // },{
        //     validator: function(value) {
        //         if (value.length > 20) return false;
        //         return true;
        //     },
        //     msg: 'Name length < 20 characters'
        // }]
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('RivenType', RivenTypeSchema);

