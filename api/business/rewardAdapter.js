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
	if (!rivsrc) throw new Error('Riven source cannot correspond to reward source');
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
	const rtype = await RewardTypeProcess.findByIdOrName(formReward.type);
	reward.type = rtype._id;
	reward.markModified('type');
	reward.date = getRewardDate(formReward);
	reward.markModified('date');
	if (rtype.name.search('Booster') >= 0) {
		reward.booster = await getRewardBooster(formReward);
		reward.markModified('booster');
	}
	else if (reward.booster) {
		reward.booster = null;
		reward.markModified('booster');
	}
	if (rtype.name.search('Riven') >= 0) {
		const rtype = await RivenTypeProcess.findByIdOrName(formReward.rivenType);
		if (!rtype) throw new Error('Reward with riven but without valid rivenType');
		reward.rivenType = rtype._id;
		reward.markModified('rivenType');
		const riven = await manageRewardRiven(formReward, userId, rtype._id, reward._id, rsource);
		reward.riven = riven._id;
		reward.markModified('riven');
	} else if (reward.riven) {
		const riven = await Riven.findById({_id: reward.riven._id});
		reward.riven = null;
		reward.markModified('riven');
		reward.rivenType = null;
		reward.markModified('rivenType');
		await riven.remove();
	}
	reward.markModified('riven');
	//console.log(JSON.stringify(reward));
	await reward.save();
	return reward;
};

exports.form2reward = form2reward;
