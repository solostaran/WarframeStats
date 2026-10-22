'use strict';

// v3 : a netracell reward is a run with 1 loot (Netracell) or 1 to 3 loots (Deep Archimedea).
// The reward and tauforged of every existing run become its single loot.
const mongoose = require('mongoose');

const up = async function() {
	const Netracell = mongoose.model('NetracellReward');
	// native collection : the "reward" and "tauforged" fields are no longer in the schema
	// pipeline update : a missing "tauforged" is not written in the loot
	const result = await Netracell.collection.updateMany(
		{ loots: { $exists: false }, reward: { $exists: true } },
		[
			{ $set: { loots: [{ reward: '$reward', tauforged: '$tauforged' }] } },
			{ $unset: ['reward', 'tauforged'] }
		]
	);
	console.log("Netracell rewards converted to loots : "+result.modifiedCount);
};

module.exports = {
	version: 3,
	description: 'netracell rewards : loots array',
	up: up
};
