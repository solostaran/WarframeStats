'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const rewardProcess = require('../api/business/rewardProcess');
const convertDates = require('../api/utils/convertDates');
const obfuscate = require('../api/utils/obfuscate');

router.get('/', auth.optional, function (_req, res) {
	rewardProcess.list({})
		.then(ret => res.json(ret))
		.catch(err => res.status(500).send("Cannot list rewards from DB, "+err));
});

router.get('/raw', auth.optional, function(_req, res) {
	rewardProcess.list_raw()
		.then(ret => res.json(ret))
		.catch(err => res.status(500).send("Cannot list rewards from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
	const { auth: { id } } = req;
	rewardProcess.addOrUpdate(req.body, id)
		.then(ret => {
			console.log("Add 1 reward["+ret._id+"] by User["+obfuscate.obfuscate_id(id)+"]");
			res.json(ret)
		})
		.catch(err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', auth.required, function(req, res) {
	const { auth: { id } } = req;
	rewardProcess.adds(req.body, id,
		ret => res.json(ret),
		err => res.status(400).send('Invalid body, '+err));
});

router.post('/form', auth.required, function(req, res) {
	const { auth: { id } } = req;
	rewardProcess.addOrUpdate(req.body, id)
		.then(ret => {
			console.log("Add 1 reward["+ret._id+"] by User["+obfuscate.obfuscate_id(id)+"]");
			rewardProcess.findById(ret._id)
					.then(reward => res.render('rewardDetails',
						{
							title: 'Reward Details',
							date2string: convertDates.date2string,
							reward: reward,
							obfuscate_email: obfuscate.obfuscate_email
						}))
					.catch(err => res.status(400).send(err))
			}
		).catch(err => res.render('error', {message: err.message, error: {}}));
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
					reward: reward,
					obfuscate_email: obfuscate.obfuscate_email
				});
			else
				res.status(404).send(null);
		})
		.catch(err => res.status(500).send(err));
});

router.delete('/delete/:id', auth.required, function(req, res) {
	const { auth: { id } } = req;
	rewardProcess.deleteOneById(req.params.id)
		.then(ret => {
			console.log("Delete reward["+ret._id+"] by User["+obfuscate.obfuscate_id(id)+"]");
			res.status(200).send(ret);
		})
		.catch(err => res.status(400).send("Cannot delete : "+err));
});

router.delete('/deleteall', auth.required, function(req, res) {
	const { auth: { id } } = req;
	console.log("Delete all Rewards by User["+obfuscate.obfuscate_id(id)+"]");
	rewardProcess.deleteAll()
		.then(ret => res.status(200).send(ret))
		.catch(err => res.status(500).send("Cannot delete all rewards in DB, "+err));
});

module.exports = router;
