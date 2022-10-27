'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RewardTypeProcess = require('../api/business/rewardTypeProcess'),
	RewardSourceProcess = require('../api/business/rewardSourceProcess'),
	BoosterTypeProcess = require('../api/business/boosterTypeProcess'),
	RivenTypeProcess = require('../api/business/rivenTypeProcess'),
	RivenConditionProcess = require('../api/business/rivenConditionProcess'),
	RewardProcess = require('../api/business/rewardProcess'),
	convertDates = require('../api/utils/convertDates');

// SERVER MEMORY CACHE
let rewardTypes = [];
let rewardSources = [];
let boosterTypes =[];
let boosters = {};
let rivenTypes = [];
async function initialize() {
	rewardTypes = await RewardTypeProcess.list();
	rewardSources = await RewardSourceProcess.list();
	boosterTypes = await BoosterTypeProcess.list();
	boosters = await BoosterTypeProcess.to_array();
	rivenTypes = await RivenTypeProcess.list();
}
initialize();

router.get('/', auth.required, function(req, res) {
	Promise.all([
		RivenConditionProcess.formattedList()
	]).then(results => {
		let param = {
			title: 'Reward Form',
			types: rewardTypes,
			sources: rewardSources,
			boosters: boosterTypes,
			rivens: rivenTypes,
			conditions: results[0]
		};
		res.render('rewardForm', param);
	}).catch(err => res.status(500).send(err));
});

async function provideRewardList(req, res) {
	let offset = req.body.offset ? Number(req.body.offset) : 0;
	let nb = req.body.nb ? Number(req.body.nb) : 20;
	//const rewardTypes = await RewardTypeProcess.list();
	//const boosterTypes = await BoosterTypeProcess.to_array();
	RewardProcess.list(
		{skip: offset, limit: nb, dateLow: req.body.dateLow, dateHigh: req.body.dateHigh, type: req.body.type},
		result => {
			//console.log("Just get "+result.data.length+" rewards over "+result.count);
			res.status(200).render('rewardList2', {
				date2string: convertDates.date2string,
				rewards: result.data,
				offset: offset,
				nb: nb,
				dateLow: req.body.dateLow,
				dateHigh: req.body.dateHigh,
				hasNext: offset + nb < result.count,
				totalCount: result.count,
				//boosterTypes: boosters,
				rewardTypes: rewardTypes,
				rewardTypeSelected: req.body.type
			});
		},
		err => res.status(500).send(err));
}

router.get('/list', auth.optional, function(req, res) {
	res.render('rewardList');
});

router.post('/list2', auth.optional, function(req, res) {
	provideRewardList(req, res);
});

router.get('/list2', auth.optional, function(req, res) {
	provideRewardList(req, res);
});

router.get('/:id', auth.required, function(req, res) {
	RewardProcess.findById(req.params.id)
		.then(reward => {
			if (!reward)
				res.status(404).send(null);
			else
				Promise.all([
					RivenConditionProcess.formattedList()
				]).then(results => {
					let param = {
						title: 'Reward Update',
						reward: reward,
						date2string: convertDates.date2string,
						types: rewardTypes,
						sources: rewardSources,
						boosters: boosterTypes,
						rivens: rivenTypes,
						conditions: results[0] };
					res.render('rewardUpdate', param);
				}).catch(err => res.status(500).send(err));
		})
		.catch(err => res.status(500).send(err));
});

module.exports = router;
