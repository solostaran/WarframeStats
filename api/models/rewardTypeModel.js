const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// https://warframe.fandom.com/wiki/Sortie#Rewards
const RewardTypeSchema = new Schema({
	name: {
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

module.exports = mongoose.model('RewardType', RewardTypeSchema);
