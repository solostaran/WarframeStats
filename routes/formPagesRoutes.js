'use strict';

// Pages with a table and a generic modal form ("Rivens", "Rewards", "Netracells 2" in the menu).
// The login state comes from config/loginState.js (res.locals.connected).
const express = require('express');
const router = express.Router();

const forms = require('../api/forms');

function formPage(view, title, formId) {
	return async function(_req, res, next) {
		try {
			res.render(view, {
				title: title,
				form: await forms.viewModel(formId),
				isLoggedIn: res.locals.connected === true
			});
		} catch (err) {
			next(err);
		}
	};
}

router.get('/rivens', formPage('rivens', 'Rivens', 'riven'));
router.get('/rewards', formPage('rewards', 'Rewards', 'reward'));
// "/netracells/list" and "/netracells/addForm" stay in routes/netracellsRoutes.js
router.get('/netracells', formPage('netracells', 'Netracells', 'netracell'));

module.exports = router;
