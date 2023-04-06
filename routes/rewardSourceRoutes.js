'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RewardSourceProcess = require('../api/business/rewardSourceProcess');

router.get('/', auth.optional, function (_req, res) {
	RewardSourceProcess
		.list()
		.then(ret => res.json(ret))
		.catch(err => res.status(500).send("Cannot list reward sources from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
	RewardSourceProcess
		.addOrUpdate(req.body)
		.then(ret => res.json(ret))
		.catch(err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', auth.required, function(req, res) {
	RewardSourceProcess
		.adds(req.body)
		.then(ret => res.json({ "insertedCount": ret.insertedCount}))
		.catch(err => res.status(400).send('Invalid body, '+err));
});

router.put('/update', auth.required, function(req, res) {
	RewardSourceProcess
		.addOrUpdate(req.body)
		.then(ret => res.json({_id: ret._id, oldName: ret.name, newName: req.body.name}))
		.catch(err => res.status(400).send('Invalid body, '+err));
});

router.get('/:id', auth.optional, function (req, res) {
	RewardSourceProcess.findById(req.params.id)
		.then(ret => {
			if (!ret)
				res.status(404).send(null);
			else
				res.send(ret);
		})
		.catch(err => res.status(400).send(err));
});

router.delete('/delete/:id', auth.required, function(req, res) {
	RewardSourceProcess.deleteOneById(req.params.id)
		.then(ret => res.status(200).send(ret))
		.catch(err => res.status(400).send("Cannot delete, "+err));
});

router.delete('/deleteall', auth.required, function(req, res) {
	const { auth: { id } } = req;
	console.log("Delete all Reward Sources by User : "+id);
	RewardSourceProcess.deleteAll()
		.then(ret => res.status(200).send(ret))
		.catch(err => res.status(500).send("Cannot delete all reward types in DB, "+err));
});

module.exports = router;
