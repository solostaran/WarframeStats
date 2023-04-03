'use strict';

const mongoose = require('mongoose'),
	ConvertDate = require('../utils/convertDates.js'),
	Riven = mongoose.model('Riven'),
	Reward = mongoose.model('Reward'),
	RewardSourceProcess = require('./rewardSourceProcess'),
	RewardTypeProcess = require('./rewardTypeProcess.js'),
	BoosterTypeProcess = require('./boosterTypeProcess.js'),
	RivenTypeProcess = require('./rivenTypeProcess.js'),
	RivenSourceProcess = require('./rivenSourceProcess');

const getRewardBooster = async function (formReward) {
	if (formReward.booster) {
		if (mongoose.Types.ObjectId.isValid(formReward.booster)) {
			return formReward.booster;
		} else {
			const boosterType = await BoosterTypeProcess.findByIdOrName(formReward.booster);
			return boosterType._id;
		}
	}
	else
		throw new Error('Type is booster but no booster provided.');
};

const manageRewardRiven = async function (formReward, userId, rivenType, rewardId, rewardSrc) {
	const rivsrc = await RivenSourceProcess.findByIdOrName(rewardSrc.name);
	if (!rivsrc) throw new Error('Riven source doesn\'t correspond to reward source');
	let riven;
	if (formReward.rivenId) {
		riven = await Riven.findById({_id: formReward.rivenId});
		if (!riven) throw new Error('Reward with Riven ID that doesn\'t exists.');
		riven.modifiedBy = userId;
		riven.markModified('modifiedBy');
	} else {
		riven = new Riven();
		riven.createdBy = userId;
		riven.markModified('createdBy');
	}
	riven.type = rivenType;
	riven.markModified('type');
	riven.source = rivsrc._id;
	riven.markModified('source');
	riven.weaponName = formReward.rivenWeaponName;
	riven.markModified('weaponName');
	if (formReward.rivenN) {
		riven.N = formReward.rivenN;
	}
	if (formReward.rivenConditions) {
		const conds = formReward.rivenConditions.filter(function (cond) {	return cond !== 'none';	});
		riven.conditions = conds;
		riven.markModified('conditions');
	}
	riven.reward = rewardId;
	riven.markModified('reward');
	await riven.save();
	return riven;
};

const getRewardDate = function(formReward) {
	if (formReward.date)
		return ConvertDate.value2date(formReward.date);
	return null;
};


const form2reward = async function(formReward, userId) {
	let reward;
	if (formReward._id) {
		// update existing reward
		reward = await Reward.findById(formReward._id).exec();
		if (reward === null) {
			throw new Error('A reward id was provided but no reward found.');
		}
		reward.modifiedBy = userId;
		reward.markModified('modifiedBy');
	} else {
		// Create a new reward
		reward = new Reward();
		reward.createdBy = userId;
		reward.markModified('createdBy');
	}
	const rsource = await RewardSourceProcess.findByIdOrName(formReward.source);
	reward.source = rsource._id;
	reward.markModified('source');
	const rewtype = await RewardTypeProcess.findByIdOrName(formReward.type);
	reward.type = rewtype._id;
	reward.markModified('type');
	reward.date = getRewardDate(formReward);
	if (reward.date === null) throw new Error('Reward without a date');
	reward.markModified('date');
	if (rewtype.name.search('Booster') >= 0) {
		reward.booster = await getRewardBooster(formReward);
		reward.markModified('booster');
	}
	else if (reward.booster) {
		reward.booster = null;
		reward.markModified('booster');
	}
	if (rewtype.name.search('Riven') >= 0) {
		const rivtype = await RivenTypeProcess.findByIdOrName(formReward.rivenType);
		if (!rivtype) throw new Error('Reward with riven but without valid rivenType');
		reward.rivenType = rivtype._id;
		reward.markModified('rivenType');
		if (formReward.rivenWeaponName || (formReward.rivenConditions && formReward.rivenConditions[0] !== 'none')) {
			// riven information in form = update or create a riven
			const riven = await manageRewardRiven(formReward, userId, rivtype._id, reward._id, rsource);
			reward.riven = riven._id;
			reward.markModified('riven');
		} else if (reward.riven) {
			// old unveiled riven + no riven info in form = remove the old unveiled riven
			const riven = await Riven.findById({_id: reward.riven._id});
			reward.riven = null;
			reward.markModified('riven');
			await riven.remove();
		}
	} else if (reward.riven) {
		// old riven exists + reward is no longer a riven = remove old riven
		const riven = await Riven.findById({_id: reward.riven._id});
		reward.riven = null;
		reward.markModified('riven');
		reward.rivenType = null;
		reward.markModified('rivenType');
		await riven.remove();
	}
	//console.log(JSON.stringify(reward));
	await reward.save();
	return reward;
};

exports.form2reward = form2reward;
