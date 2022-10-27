const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RewardSchema = new Schema({
	source : {
		type: Schema.Types.ObjectId,
		ref: 'RewardSource',
		required: true
	},
	type : {
		type: Schema.Types.ObjectId,
		ref: 'RewardType',
		required: true
	},
	Created_date: {
		type: Date,
		default: Date.now
	},
	date : {
		type: Date,
		required: false
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
	},
	booster : {
		type: Schema.Types.ObjectId,
		ref: 'BoosterType',
		required: false,
		default: undefined
	},
	riven : {
		type: Schema.Types.ObjectId,
		ref: 'Riven',
		required: false,
		default: undefined
	},
	rivenType : {
		type: Schema.Types.ObjectId,
		ref: 'RivenType',
		required: false,
		default: undefined
	}
});

module.exports = mongoose.model('Reward', RewardSchema);
