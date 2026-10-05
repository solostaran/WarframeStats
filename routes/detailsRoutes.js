'use strict';

// Read-only details of a record for the "More info" modal (api/details).
// No login needed, like the "/.../view/:id" pages : the data holds nothing sensitive.
const express = require('express');
const router = express.Router();

const details = require('../api/details');

const ID_PATTERN = /^[0-9a-f]{24}$/i;

router.get('/:kind/:id', async function(req, res) {
	const build = details.get(req.params.kind);
	if (!build || !ID_PATTERN.test(req.params.id))
		return res.status(404).json({ error: 'Not found' });
	try {
		const result = await build(req.params.id);
		if (!result)
			return res.status(404).json({ error: 'Not found' });
		res.json(result);
	} catch (err) {
		res.status(500).json({ error: 'Details not available' });
	}
});

module.exports = router;
