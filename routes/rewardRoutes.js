'use strict';

const express = require('express');
const router = express.Router();

const mongoose = require('mongoose');
const auth = require('../config/jwt_auth').auth;
const rewardProcess = require('../api/business/rewardProcess');
const { obfuscate_id } = require('../api/utils/obfuscate');

// The query of a bootstrap-table in server-side pagination (public input : only expected values are kept).
// The filter-control selects send ids : "type.name" and "source.name" a type/source id,
// "additionalInfo" "-" (no booster nor riven), "b:<booster type id>" or "r:<riven type id>".
function pagedOptions(query) {
	const integer = (value, def, min, max) => {
		const n = Number.parseInt(value, 10);
		return Number.isNaN(n) ? def : Math.min(Math.max(n, min), max);
	};
	const day = value => (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined);
	const id = value => (typeof value === 'string' && mongoose.isValidObjectId(value) ? value : undefined);
	const options = {
		offset: integer(query.offset, 0, 0, Number.MAX_SAFE_INTEGER),
		limit: integer(query.limit, 10, 1, 100),
		order: query.order === 'asc' ? 1 : -1,	// only sorted by date
		dateLow: day(query.dateLow),
		dateHigh: day(query.dateHigh)
	};
	if (query.filter !== undefined) {
		const filter = JSON.parse(query.filter);	// throws on a malformed filter
		if (filter === null || typeof filter !== 'object') throw new Error('not an object');
		options.type = id(filter['type.name']);
		options.source = id(filter['source.name']);
		const info = filter.additionalInfo;
		if (info === '-') options.none = true;
		else if (typeof info === 'string' && info.startsWith('b:')) options.booster = id(info.slice(2));
		else if (typeof info === 'string' && info.startsWith('r:')) options.rivenType = id(info.slice(2));
	}
	return options;
}

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

// one page of rewards : { total, rows } (server-side pagination of the "PagedRewards" page)
router.get('/paged', auth.optional, function(req, res) {
	let options;
	try {
		options = pagedOptions(req.query);
	} catch (err) {
		return res.status(400).send('Invalid filter, '+err.message);
	}
	rewardProcess.list_paged(options)
		.then(ret => res.json(ret))
		.catch(err => res.status(500).send("Cannot list rewards from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
	const { auth: { id } } = req;
	rewardProcess.addOrUpdate(req.body, id)
		.then(ret => {
			console.log("Add 1 reward["+ret._id+"] by User["+obfuscate_id(id)+"]");
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

router.delete('/delete/:id', auth.required, function(req, res) {
	const { auth: { id } } = req;
	rewardProcess.deleteOneById(req.params.id)
		.then(ret => {
			console.log("Delete reward["+ret._id+"] by User["+obfuscate_id(id)+"]");
			res.status(200).send(ret);
		})
		.catch(err => res.status(400).send("Cannot delete : "+err));
});

router.delete('/deleteall', auth.required, function(req, res) {
	const { auth: { id } } = req;
	console.log("Delete all Rewards by User["+obfuscate_id(id)+"]");
	rewardProcess.deleteAll()
		.then(ret => res.status(200).send(ret))
		.catch(err => res.status(500).send("Cannot delete all rewards in DB, "+err));
});

module.exports = router;
