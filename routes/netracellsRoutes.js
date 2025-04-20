'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const NetracellProcess = require('../api/business/netracellRewardProcess'),
	convertDates = require('../api/utils/convertDates');

// SERVER MEMORY CACHE
const { netracellRewardTypes }  = require('../api/models/netracellModel');

router.get('/list', auth.optional, function(req, res) {
	res.render('netracellList', {
		date2string: convertDates.date2string,
		types: netracellRewardTypes
	});
});

router.post('/addForm', auth.required, function(req, res) {
	const { auth: { id } } = req;
	// TODO: provide injection protection ? or maybe the Mongoose Model can do the trick.
	const new_netracell = {
		reward: req.body.reward,
		date: req.body.date,
	}
	if (req.body.tauforged === 'true') new_netracell.tauforged = true;
	NetracellProcess.addOrUpdate(new_netracell, id)
		.then(ret => {
			res.render('netracellList', {
				date2string: convertDates.date2string,
				types: netracellRewardTypes
			});
		}).catch(err => res.status(500).send(err));
});

module.exports = router;
