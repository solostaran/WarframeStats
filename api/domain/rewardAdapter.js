'use strict';

const mongoose = require('mongoose'),
	ConvertDate = require('./convertDates.js'),
	Riven = mongoose.model('Riven'),
	Reward = mongoose.model('Reward'),
	RewardSourceProcess = require('./rewardSourceProcess'),
	RewardTypeProcess = require('./rewardTypeProcess.js'),
	BoosterTypeProcess = require('./boosterTypeProcess.js'),
	RivenTypeProcess = require('./rivenTypeProcess.js'),
	RivenSourceProcess = require('./rivenSourceProcess');

const getRewardBooster = async function (formReward) {
	if (!formReward.booster) throw new Error('Type is booster but no booster provided.');
	const boosterType = await BoosterTypeProcess.findByIdOrName(formReward.booster);
	if (!boosterType) throw new Error('Unknown booster type: ' + formReward.booster);
	return boosterType._id;
};

const manageRewardRiven = async function (formReward, userId, rivenType, rewardId, rewardSrc) {
	const rivsrc = await RivenSourceProcess.findByIdOrName(rewardSrc.name);
	if (!rivsrc) throw new Error('Riven source doesn\'t correspond to reward source');
	let riven;
	if (formReward['rivenId']) {
		riven = await Riven.findById({_id: formReward['rivenId']}).exec();
		if (!riven) throw new Error('Reward with Riven ID that doesn\'t exists.');
		riven.modifiedBy = userId;
		riven.markModified('modifiedBy');
		riven.Modified_date = new Date();
		riven.markModified('Modified_date');
	} else {
		riven = new Riven();
		riven.createdBy = userId;
		riven.markModified('createdBy');
	}
	riven.type = rivenType;
	riven.markModified('type');
	riven.source = rivsrc._id;
	riven.markModified('source');
	riven.weaponName = formReward['rivenWeaponName'];
	riven.markModified('weaponName');
	if (formReward['rivenN']) {
		riven.N = formReward['rivenN'];
	}
	if (formReward['rivenConditions']) {
		riven.conditions = formReward.rivenConditions.filter(function (cond) {	return cond !== 'none';	});
		riven.markModified('conditions');
	}
	riven.reward = rewardId;
	riven.markModified('reward');
	//console.log(JSON.stringify(riven));
	await riven.save();
	return riven;
};

const getRewardDate = function(formReward) {
	if (formReward.date)
		return ConvertDate.value2date(formReward.date);
	throw new Error('Reward without a date');
};


const form2reward = async function(formReward, userId) {
	let reward;
	if (formReward._id) {
		// update existing reward
		reward = await Reward.findById(formReward._id).exec();
		if (reward === null) throw new Error('A reward id was provided but no reward found.');
		reward.modifiedBy = userId;
		reward.markModified('modifiedBy');
		reward.Modified_date = new Date();
		reward.markModified('Modified_date');
	} else {
		// Create a new reward
		reward = new Reward();
		reward.createdBy = userId;
		reward.markModified('createdBy');
	}
	const rsource = await RewardSourceProcess.findByIdOrName(formReward.source);
	if (!rsource) throw new Error('Unknown reward source: ' + formReward.source);
	reward.source = rsource._id;
	reward.markModified('source');
	const rewtype = await RewardTypeProcess.findByIdOrName(formReward.type);
	if (!rewtype) throw new Error('Unknown reward type: ' + formReward.type);
	reward.type = rewtype._id;
	reward.markModified('type');
	reward.date = getRewardDate(formReward);
	reward.markModified('date');
	if (rewtype.name.search('Booster') >= 0) {
		reward.booster = await getRewardBooster(formReward);
		reward.markModified('booster');
	}
	else if (reward.booster) {
		reward.booster = null;
		reward.markModified('booster');
	}
	let oldRiven;	// riven to delete : the reward no longer has riven information, or is no longer a riven
	if (rewtype.name.search('Riven') >= 0) {
		const rivtype = await RivenTypeProcess.findByIdOrName(formReward.rivenType);
		if (!rivtype) throw new Error('Reward with riven but without valid rivenType');
		reward.rivenType = rivtype._id;
		reward.markModified('rivenType');
		if (formReward['rivenWeaponName'] || (formReward['rivenConditions'] && formReward.rivenConditions[0] !== 'none')) {
			// riven information in form = update or create a riven
			const riven = await manageRewardRiven(formReward, userId, rivtype._id, reward._id, rsource);
			reward.riven = riven._id;
			reward.markModified('riven');
		} else if (reward.riven) {
			// old unveiled riven + no riven info in form = remove the old unveiled riven
			oldRiven = reward.riven;
			reward.riven = null;
			reward.markModified('riven');
		}
	} else if (reward.riven) {
		// old riven exists + reward is no longer a riven = remove old riven
		oldRiven = reward.riven;
		reward.riven = null;
		reward.markModified('riven');
		reward.rivenType = null;
		reward.markModified('rivenType');
	} else if (reward.rivenType) {
		// reward is no longer a riven (and has no unveiled riven) = remove its old riven type
		reward.rivenType = null;
		reward.markModified('rivenType');
	}
	//console.log(JSON.stringify(reward));
	await reward.save();
	// the old riven is deleted once the reward no longer references it (nothing is deleted if the save fails)
	if (oldRiven) await Riven.deleteOne({ _id: oldRiven }).exec();
	return reward;
};

exports.form2reward = form2reward;
