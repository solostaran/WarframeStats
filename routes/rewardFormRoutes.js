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

function provideRewardList(req, res) {
	let offset = req.body.offset ? Number(req.body.offset) : 0;
	let nb = req.body.nb ? Number(req.body.nb) : 10;
	// filters come from a public form : only plain strings are used
	const asString = value => (typeof value === 'string' && value.length > 0 ? value : undefined);
	RewardProcess.list(
		{skip: offset, limit: nb, dateLow: asString(req.body.dateLow), dateHigh: asString(req.body.dateHigh), type: asString(req.body.type)}
	).then(
		result => {
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
		}
	).catch(err => res.status(500).send(err));
}

router.post('/list2', auth.optional, function(req, res) {
	provideRewardList(req, res);
});

router.get('/list2', auth.optional, function(req, res) {
	req.body = {};
	provideRewardList(req, res);
});

// only a reward id : anything else (e.g. the removed "/list" page) goes to the 404 page
function rewardIdOnly(req, _res, next) {
	next(/^[0-9a-f]{24}$/i.test(req.params.id) ? undefined : 'route');
}

router.get('/:id', rewardIdOnly, auth.required, function(req, res) {
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
