'use strict'

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RivenTypeProcess = require('../api/business/rivenTypeProcess');
const RivSrcProcess = require('../api/business/rivenSourceProcess');
const RivenConditionProcess = require('../api/business/rivenConditionProcess');
const RivenProcess = require('../api/business/rivenProcess');
const convertDates = require('../api/utils/convertDates');

router.get('/', auth.required, async function (_req, res) {
	try {
		const rivenTypes = await RivenTypeProcess.list();
		const rivenSources = await RivSrcProcess.list();
		const rivenConditions = await RivenConditionProcess.formattedList();
		res.render('rivenForm', {title: 'Riven Form', types: rivenTypes, sources: rivenSources, conditions: rivenConditions});
	} catch (err) {
		res.render('error', {err: err});
	}
});

router.get('/list', auth.optional, async function(_req,res) {
	try {
		const rivens = await RivenProcess.list();
		res.render('rivenList', {
			title: 'Riven Form',
			date2string: convertDates.date2string,
			rivens: rivens});
	} catch (err) {
		res.render('error', {err: err});
	}
});

router.get('/:id', auth.required, function(req, res) {
	RivenProcess.byId(req.params.id)
		.then(riven => {
			// console.log(JSON.stringify(riven));
			if (!riven)
				res.status(404).send(null);
			else
				Promise.all([
					RivenTypeProcess.list(),
					RivenConditionProcess.formattedList(),
					RivSrcProcess.list()
				]).then(results => {
					let param = {
						title: 'Riven Update',
						riven: riven,
						date2string: convertDates.date2string,
						types: results[0],
						conditions: results[1],
						sources: results[2]
					};
					res.render('rivenUpdate', param);
				}).catch(err => res.status(500).send(err));
		})
		.catch(err => res.status(500).send(err));
});

module.exports = router;
