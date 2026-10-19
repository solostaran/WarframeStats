const mongoose = require('mongoose')
const { Schema } = mongoose;

const temporalRewardSources = ["Temporal Archimedea"];
const TemporalRewardSource = new Schema({
	type: {
		type: String,
		enum: temporalRewardSources
	}});

// every loot of the silver, gold and legendary tables of the official droptables,
// a "Tauforged X Archon Shard" being a "X Archon Shard" loot with the "tauforged" flag
const temporalRewardTypes = ["Azure Archon Shard", "Amber Archon Shard", "Crimson Archon Shard", "Emerald Archon Shard", "Topaz Archon Shard", "Violet Archon Shard",
	"Arcane Escapist", "Arcane Hot Shot", "Arcane Universal Fallout", "Elemental Vice", "Omni Forma", "Omni Forma Blueprint"];
// only shards can be tauforged
const temporalTauforgeableTypes = temporalRewardTypes.filter(type => type.includes('Shard'));
const TemporalRewardType = new Schema({
	type: {
		type: String,
		enum: temporalRewardTypes
	}});

// a loot of a run : only the shards can be tauforged
const TemporalLoot = new Schema({
	reward: {
		type: TemporalRewardType,
		required: true
	},
	tauforged: {
		type: Boolean,
		required: false
	}
}, { _id: false });

// maximum count of loots of a run, per source
const temporalMaxLoots = { 'Temporal Archimedea': 3 };

// a run : 1 to 3 loots from a Temporal Archimedea
const TemporalRewardsSchema = new Schema({
	source: {
		type: TemporalRewardSource,
		required: true
	},
	loots: {
		type: [TemporalLoot],
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

TemporalRewardType.methods.toType = function() {
	return this.type;
}

TemporalRewardSource.methods.toType = function() {
	return this.type;
}

mongoose.model('TemporalRewardSource', TemporalRewardSource);
mongoose.model('TemporalRewardType', TemporalRewardType);
mongoose.model('TemporalReward', TemporalRewardsSchema);

exports.temporalRewardTypes = temporalRewardTypes;
exports.temporalTauforgeableTypes = temporalTauforgeableTypes;
exports.temporalRewardSources = temporalRewardSources;
exports.temporalMaxLoots = temporalMaxLoots;
