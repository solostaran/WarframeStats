const mongoose = require('mongoose')
const { Schema } = mongoose;

// https://www.geeksforgeeks.org/how-to-create-and-use-enum-in-mongoose/
const netracellRewardSources = ["Netracell", "Deep Archimedea"];
const NetracellRewardSource = new Schema({
	type: {
		type: String,
		enum: netracellRewardSources
	}});

const netracellRewardTypes = ["Azure Archon Shard", "Amber Archon Shard", "Crimson Archon Shard", "Melee Arcane Adapter", "Melee Crescendo", "Melee Duplicate"];
const NetracellRewardType = new Schema({
	type: {
		type: String,
		enum: netracellRewardTypes
	}});

const NetracellRewardsSchema = new Schema({
	source: {
		type: NetracellRewardSource,
		required: true
	},
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
	},
	Modified_date: {
		type: Date,
		required: false
	}
});

NetracellRewardType.methods.toType = function() {
	return this.type;
}

NetracellRewardSource.methods.toType = function() {
	return this.type;
}

mongoose.model('NetracellRewardSource', NetracellRewardSource);
mongoose.model('NetracellRewardType', NetracellRewardType);
mongoose.model('NetracellReward', NetracellRewardsSchema);

exports.netracellRewardTypes = netracellRewardTypes;
exports.netracellRewardSources = netracellRewardSources;
