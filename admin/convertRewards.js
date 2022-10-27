'use strict'

const express = require('express');
const app = express();

const mongoose = require('mongoose'),
	BoosterType = require('../api/models/boosterTypeModel'),
	RivenType = require('../api/models/rivenTypeModel'),
	RivenOrigin = require('../api/models/rivenSourceModel'),
	RivenCondition = require('../api/models/rivenConditionModel'),
	Riven = require('../api/models/rivenModel'),
	RewardType = require('../api/models/rewardTypeModel'),
	RewardSource = require('../api/models/rewardSourceModel'),
	SortieReward = require('../api/models/sortieRewardModel'),
	Reward = require('../api/models/rewardModel'),
	RivSrcProcess = require('../api/business/rivenSourceProcess'),
	RivenProcess = require('../api/business/rivenProcess'),
	RewardSourceProcess = require('../api/business/rewardSourceProcess'),
	RewardProcess = require('../api/business/rewardProcess'),
	convertDates = require('../api/utils/convertDates'),
	bodyParser = require('body-parser'),
	User = require('../api/models/Users'),
	logger = require('morgan');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: true
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/WarframeStatsDB', { useUnifiedTopology: true, useNewUrlParser: true })
	.then(() => console.log("Mongo connected."))
	.catch(err => {
		console.error("Connexion aborted ! "+err);
		process.exit(5);
	});

const users = mongoose.model('Users');

const delay = ms => new Promise(res => setTimeout(res, ms));

async function addSortieSourceOnSortieRewards() {
	let sortieReward = await RewardSourceProcess.findByIdOrName('Sortie');
	let sortieRiven = await RivSrcProcess.findByIdOrOrigin('Sortie');
	let solo = await users.findOne({email: 'solostaran14@gmail.com'});
	console.log('Sortie ='+sortieReward);
	SortieReward.find({}).sort({date: 1})
		.then(async function(list) {
			console.log('Found '+list.length+' Sortie\'s rewards');
			for (const rew of list) {
				let reward = new Reward();
				reward.source = sortieReward._id;
				reward.type= rew.type;
				reward.Created_date = rew.Created_date;
				reward.date = rew.date;
				if (rew.createdBy) reward.createdBy = rew.createdBy;
				else reward.createdBy = solo._id;
				if (rew.modifiedBy) reward.modifiedBy = rew.modifiedBy;
				if (rew.booster) reward.booster = rew.booster;
				const {_id: rewardId  } = await reward.save();
				if (rew.riven) {
					let riven = new Riven();
					riven.type = rew.riven.type;
					if (rew.riven.weaponName) riven.weaponName = rew.riven.weaponName;
					if (rew.riven.conditions) riven.conditions = rew.riven.conditions;
					if (rew.riven.N) riven.N = rew.riven.N;
					riven.source = sortieRiven._id;
					riven.Created_date = rew.Created_date;
					riven.reward = rewardId;
					if (rew.createdBy) riven.createdBy = rew.createdBy;
					else riven.createdBy = solo._id;
					if (rew.modifiedBy) riven.modifiedBy = rew.modifiedBy;
					let {_id: rivenId} = await riven.save();
					reward.rivenType = rew.riven.type;
					reward.markModified('rivenType');
					reward.riven = rivenId;
					reward.markModified('riven');
					await reward.save();
				}
			};
			await delay(2000);
			await mongoose.disconnect();
			console.log("Mongo disconnected.");
		});
}

//addSortieSourceOnSortieRewards(); // Uncomment to run

// async function addRivenTypeOnReward() {
// 	Reward.find({riven: {$exists: true}}).populate('riven','type')
// 		.then(async function(list) {
// 			for (const rew of list) {
// 				rew.rivenType = rew.riven.type;
// 				rew.markModified('rivenType');
// 				await rew.save();
// 			}
// 			await delay(2000);
// 			await mongoose.disconnect();
// 			console.log("Mongo disconnected.");
// 		});
// }
//addRivenTypeOnReward();


