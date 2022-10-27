const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// https://warframe.fandom.com/wiki/Riven_Mods
const RivenSourceSchema = new Schema({
	source: {
		type: String,
		required: true
	},
	more_info: {
		type: String,
		alias: 'info',
		required: false
	}
},{
	versionKey: false
});

module.exports = mongoose.model('RivenSource', RivenSourceSchema);
