'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const rewardProcess = require('../api/business/rewardProcess');
const convertDates = require('../api/utils/convertDates');

router.get('/', auth.optional, function (req, res) {
	rewardProcess.list({},
		ret => res.json(ret),
		err => res.status(500).send("Cannot list rewards from DB, "+err));
});

router.get('/raw', auth.optional, function(req, res) {
	rewardProcess.rawlist(
		ret => res.json(ret),
		err => res.status(500).send("Cannot list rewards from DB, "+err)
	);
});

router.post('/add', auth.required, function(req, res) {
	const { payload: { id } } = req;
	rewardProcess.addOrUpdate(req.body, id)
		.then(ret => res.json(ret))
		.catch(err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', auth.required, function(req, res) {
	const { payload: { id } } = req;
	rewardProcess.adds(req.body, id,
		ret => res.json(ret),
		err => res.status(400).send('Invalid body, '+err));
});

router.post('/form', auth.required, function(req, res) {
	const { payload: { id } } = req;
	rewardProcess.addOrUpdate(req.body, id)
		.then(ret => rewardProcess.findById(ret._id)
			.then(reward => res.render('rewardDetails',
				{
					title: 'Reward Details',
					date2string: convertDates.date2string,
					reward: reward
				}))
			.catch(err => res.status(400).send(err))
		);
});

router.get('/:id', auth.optional, function (req, res) {
	rewardProcess.findById(req.params.id)
		.then(reward => {
			if (reward)
				res.send(reward);
			else
				res.status(404).send(null);
		})
		.catch(err => res.status(500).send(err));
});

router.get('/view/:id', auth.optional, function(req, res) {
	rewardProcess.findById(req.params.id)
		.then(reward => {
			if (reward)
				res.render('rewardDetails', {
					date2string: convertDates.date2string,
					reward: reward
				});
			else
				res.status(404).send(null);
		})
		.catch(err => res.status(500).send(err));
});

router.delete('/delete/:id', auth.required, function(req, res) {
	rewardProcess.deleteOneById(req.params.id)
		.then(ret => res.status(200).send(ret))
		.catch(err => res.status(400).send("Cannot delete : "+err));
});

router.delete('/deleteall', auth.required, function(req, res) {
	rewardProcess.deleteAll()
		.then(ret => res.status(200).send(ret))
		.catch(err => res.status(500).send("Cannot delete all rewards in DB, "+err));
});

module.exports = router;
