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
// only shards can be tauforged
const netracellTauforgeableTypes = netracellRewardTypes.filter(type => type.includes('Shard'));
const NetracellRewardType = new Schema({
	type: {
		type: String,
		enum: netracellRewardTypes
	}});

// a loot of a run : only the shards can be tauforged
const NetracellLoot = new Schema({
	reward: {
		type: NetracellRewardType,
		required: true
	},
	tauforged: {
		type: Boolean,
		required: false
	}
}, { _id: false });

// maximum count of loots of a run, per source
const netracellMaxLoots = { 'Netracell': 1, 'Deep Archimedea': 3 };

// a run : 1 loot from a Netracell, 1 to 3 loots from a Deep Archimedea
const NetracellRewardsSchema = new Schema({
	source: {
		type: NetracellRewardSource,
		required: true
	},
	loots: {
		type: [NetracellLoot],
		validate: {
			validator: loots => loots.length >= 1,
			message: 'At least 1 loot.'
		}
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
exports.netracellTauforgeableTypes = netracellTauforgeableTypes;
exports.netracellRewardSources = netracellRewardSources;
exports.netracellMaxLoots = netracellMaxLoots;
