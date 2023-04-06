'use strict';

// TODO: add update (we need this to change "exilus" to "warframe exilus adapter")

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RewardTypeProcess = require('../api/business/rewardTypeProcess');

router.get('/', auth.optional, function (req, res) {
	RewardTypeProcess
		.list()
		.then(ret => res.json(ret))
		.catch(err => res.status(500).send("Cannot list reward types from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
	RewardTypeProcess
		.add(req.body)
		.then(ret => res.json(ret))
		.catch(err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', auth.required, function(req, res) {
	RewardTypeProcess
		.adds(req.body)
		.then(ret => res.json({ "insertedCount": ret.insertedCount}))
		.catch(err => res.status(400).send('Invalid body, '+err));
});

router.put('/update', auth.required, function(req, res) {
	RewardTypeProcess
		.update(req.body)
		.then(ret => res.json({_id: ret._id, oldName: ret.name, newName: req.body.name}))
		.catch(err => res.status(400).send('Invalid body, '+err));
});

router.get('/:id', auth.optional, function (req, res) {
	RewardTypeProcess.findById(req.params.id)
		.then(ret => {
			if (!ret)
				res.status(404).send(null);
			else
				res.send(ret);
		})
		.catch(err => res.status(400).send(err));
});

router.delete('/delete/:id', auth.required, function(req, res) {
	RewardTypeProcess.deleteOneById(req.params.id)
		.then(ret => res.status(200).send(ret))
		.catch(err => res.status(400).send("Cannot delete, "+err));
});

router.delete('/deleteall', auth.required, function(req, res) {
	const { auth: { id } } = req;
	console.log("Delete all Reward Types by User : "+id);
	RewardTypeProcess.deleteAll()
		.then(ret => res.status(200).send(ret))
		.catch(err => res.status(500).send("Cannot delete all reward types in DB, "+err));
});

module.exports = router;
