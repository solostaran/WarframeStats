'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const netracellRewardProcess = require('../api/business/netracellRewardProcess');
const { obfuscate_email, obfuscate_id } = require('../api/utils/obfuscate');

router.get('/raw', auth.optional, function(_req, res) {
	netracellRewardProcess.list_raw()
		.then(ret => res.json(ret))
		.catch(err => res.status(500).send("Cannot list netracell from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
	const { auth: { id } } = req;
	netracellRewardProcess.addOrUpdate(req.body, id)
		.then(ret => {
			console.log("Add 1 netracell["+ret._id+"] by User["+obfuscate_id(id)+"]");
			res.json(ret)
		})
		.catch(err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', auth.required, function(req, res) {
	const { auth: { id } } = req;
	netracellRewardProcess.adds(req.body, id,
		ret => res.json(ret),
		err => res.status(400).send('Invalid body, '+err)
	);
});

router.post('/setTypes', auth.required, function(req, res) {
	netracellRewardProcess.setTypes(
		ret => res.json(ret),
		err => res.status(400).send('Invalid body, '+err)
	);
});

router.get('/:id', auth.optional, function (req, res) {
	netracellRewardProcess.findById(req.params.id)
		.then(netracell => {
			if (netracell)
				res.send(netracell);
			else
				res.status(404).send(null);
		})
		.catch(err => res.status(500).send(err));
});

module.exports = router;
