'use strict';

const express = require('express');
const router = express.Router();

const auth = require('#root/config/jwt_auth.js').auth;
const temporalProcess = require('#root/api/business/temporalProcess.js');
const { temporalRewardTypes, temporalRewardSources } = require('#root/api/models/temporalModel.js');
const { obfuscate_id } = require('#root/api/utils/obfuscate.js');

router.get('/raw', auth.optional, function(_req, res) {
	temporalProcess.list_raw()
		.then(ret => res.json(ret))
		.catch(err => res.status(500).send("Cannot list temporal from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
	const { auth: { id } } = req;
	temporalProcess.addOrUpdate(req.body, id)
		.then(ret => {
			console.log("Add 1 temporal["+ret._id+"] by User["+obfuscate_id(id)+"]");
			res.json(ret)
		})
		.catch(err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', auth.required, function(req, res) {
	const { auth: { id } } = req;
	temporalProcess.adds(req.body, id,
		ret => res.json(ret),
		err => res.status(400).send('Invalid body, '+err)
	);
});

router.post('/setTypes', auth.required, function(req, res) {
	temporalProcess.setTypes(
		ret => res.json(ret),
		err => res.status(400).send('Invalid body, '+err)
	);
});

router.post('/setSources', auth.required, function(req, res) {
	temporalProcess.setSources(
		ret => res.json(ret),
		err => res.status(400).send('Invalid body, '+err)
	);
});

router.get('/type/', auth.optional, function(_req, res) {
	res.json(temporalRewardTypes);
});

router.get('/source/', auth.optional, function(_req, res) {
	res.json(temporalRewardSources);
});

router.get('/:id', auth.optional, function (req, res) {
	temporalProcess.findById(req.params.id)
		.then(temporal => {
			if (temporal)
				res.send(temporal);
			else
				res.status(404).send(null);
		})
		.catch(err => res.status(500).send(err));
});

module.exports = router;
