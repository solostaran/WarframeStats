const mongoose = require('mongoose')
const { Schema } = mongoose;

// https://www.geeksforgeeks.org/how-to-create-and-use-enum-in-mongoose/
const netracellRewardTypes = ["Azure Archon Shard", "Amber Archon Shard", "Crimson Archon Shard", "Melee Arcane Adapter", "Melee Crescendo", "Melee Duplicate"];
const NetracellRewardType = new Schema({
	type: {
		type: String,
		enum: netracellRewardTypes
	}});

const NetracellRewardsSchema = new Schema({
	reward: {
		type: NetracellRewardType,
		required: true
	},
	tauforged: {
		type: Boolean,
		required: false
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
	}
});

NetracellRewardType.methods.toType = function() {
	return this.type;
}

mongoose.model('NetracellRewardType', NetracellRewardType);
mongoose.model('NetracellReward', NetracellRewardsSchema);

exports.netracellRewardTypes = netracellRewardTypes;
