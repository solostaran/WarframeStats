'use strict';

// Submission of the generic modal forms (api/forms, views/mixins/formModal.pug).
// JSON only : a cross-site HTML form cannot send it, so these routes cannot be used for CSRF.
//   POST /forms/:formId       creation
//   GET  /forms/:formId/:id   current values of a record, for the edit form
//   PUT  /forms/:formId/:id   update of a record (only during forms.EDIT_PERIOD_DAYS after its creation)
const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const forms = require('../api/forms');
const formEngine = require('../api/forms/formEngine');
const { obfuscate_id } = require('../api/utils/obfuscate');

const ID_PATTERN = /^[0-9a-f]{24}$/i;
const errorMessage = err => String(err && err.message ? err.message : err);

router.post('/:formId', auth.required, async function(req, res) {
	if (!req.is('application/json'))
		return res.status(415).json({ errors: { _form: 'JSON expected' } });
	const definition = forms.get(req.params.formId);
	if (!definition)
		return res.status(404).json({ errors: { _form: 'Unknown form' } });
	const { auth: { id } } = req;
	try {
		const fields = await definition.fields();
		const { values, errors } = formEngine.validate(fields, req.body);
		if (Object.keys(errors).length > 0)
			return res.status(400).json({ errors });
		const saved = await definition.save(values, id);
		console.log("Add 1 "+definition.id+"["+(saved ? saved._id : '?')+"] by User["+obfuscate_id(id)+"]");
		res.json({ ok: true });
	} catch (err) {
		res.status(400).json({ errors: { _form: errorMessage(err) } });
	}
});

// The record to edit : sends the answer itself and returns null when it cannot be edited
async function editableRecord(req, res) {
	const definition = forms.get(req.params.formId);
	if (!definition || !ID_PATTERN.test(req.params.id)) {
		res.status(404).json({ errors: { _form: 'Not found' } });
		return null;
	}
	const record = await definition.load(req.params.id);
	if (!record) {
		res.status(404).json({ errors: { _form: 'Not found' } });
		return null;
	}
	const refusal = forms.editRefusal(record);
	if (refusal) {
		res.status(403).json({ errors: { _form: refusal } });
		return null;
	}
	return { definition, record };
}

router.get('/:formId/:id', auth.required, async function(req, res) {
	try {
		const editable = await editableRecord(req, res);
		if (editable) res.json({ values: editable.record.values });
	} catch (err) {
		res.status(500).json({ errors: { _form: errorMessage(err) } });
	}
});

router.put('/:formId/:id', auth.required, async function(req, res) {
	if (!req.is('application/json'))
		return res.status(415).json({ errors: { _form: 'JSON expected' } });
	const { auth: { id: userId } } = req;
	try {
		const editable = await editableRecord(req, res);
		if (!editable) return;
		const { definition } = editable;
		const fields = await definition.fields();
		const { values, errors } = formEngine.validate(fields, req.body);
		if (Object.keys(errors).length > 0)
			return res.status(400).json({ errors });
		// the record id comes from the URL, never from the body (validate drops any "_id")
		await definition.save(values, userId, req.params.id);
		console.log("Update 1 "+definition.id+"["+req.params.id+"] by User["+obfuscate_id(userId)+"]");
		res.json({ ok: true });
	} catch (err) {
		res.status(400).json({ errors: { _form: errorMessage(err) } });
	}
});

module.exports = router;
