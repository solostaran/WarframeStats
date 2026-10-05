'use strict';

// Registry of the generic forms. To add a form : write a definition in ./definitions and list it here.
const formEngine = require('./formEngine');

const definitions = new Map([
	require('./definitions/reward'),
	require('./definitions/riven'),
	require('./definitions/netracell')
].map(definition => [definition.id, definition]));

// A record can only be edited during this period after its creation in database
const EDIT_PERIOD_DAYS = 30;
const DAY = 24 * 60 * 60 * 1000;

// undefined for an unknown id (a Map has no inherited keys such as "__proto__")
function get(id) {
	return definitions.get(id);
}

// record : the result of a definition's load(id). Returns why it cannot be edited, or null.
function editRefusal(record, now = Date.now()) {
	const created = record.createdAt ? new Date(record.createdAt).getTime() : NaN;
	if (Number.isNaN(created) || now - created > EDIT_PERIOD_DAYS * DAY)
		return 'Created more than ' + EDIT_PERIOD_DAYS + ' days ago, it can no longer be edited.';
	return record.lockedReason || null;
}

async function viewModel(id) {
	const definition = get(id);
	if (!definition) throw new Error('Unknown form ' + id);
	return Object.assign(formEngine.toViewModel(definition, await definition.fields()), {
		editTitle: definition.editTitle || definition.title,
		editSubmitLabel: definition.editSubmitLabel || 'Update',
		editDays: EDIT_PERIOD_DAYS
	});
}

exports.EDIT_PERIOD_DAYS = EDIT_PERIOD_DAYS;
exports.get = get;
exports.editRefusal = editRefusal;
exports.viewModel = viewModel;
