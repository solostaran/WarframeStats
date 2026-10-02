'use strict';

const mongoose = require('mongoose'),
	{ toOptions } = require('../formEngine'),
	RivenTypeProcess = require('../../business/rivenTypeProcess'),
	RivenSourceProcess = require('../../business/rivenSourceProcess'),
	RivenConditionProcess = require('../../business/rivenConditionProcess'),
	RivenProcess = require('../../business/rivenProcess');

const Riven = mongoose.model('Riven');
const MAX_OPTIONAL_CONDITIONS = 5;
const idOf = value => (value ? String(value) : '');

module.exports = {
	id: 'riven',
	title: 'Add a riven',
	submitLabel: 'Add riven',
	editTitle: 'Edit a riven',
	editSubmitLabel: 'Update',
	async fields() {
		const conditions = await RivenConditionProcess.formattedList();
		const afterMandatory = { field: 'mandatoryCondition', notEmpty: true };
		return [
			{ name: 'type', label: 'Riven type', type: 'select', required: true,
				options: toOptions(await RivenTypeProcess.list()) },
			{ name: 'source', label: 'Source of the riven', type: 'select', required: true,
				options: toOptions(await RivenSourceProcess.list()) },
			{ name: 'weaponName', label: 'Weapon name', type: 'string', required: true, maxLength: 50,
				placeholder: 'ex: Nagantaka' },
			{ name: 'mandatoryCondition', label: 'Mandatory condition', type: 'select',
				options: toOptions(conditions.mandatories, 'description') },
			{ name: 'N', label: "Mandatory condition variable 'N'", type: 'integer', min: 0,
				showIf: afterMandatory },
			{ name: 'optionalConditions', label: 'Optional conditions', type: 'list', max: MAX_OPTIONAL_CONDITIONS,
				options: toOptions(conditions.optionals, 'description'),
				showIf: afterMandatory }
		];
	},
	// current values of a record, for the edit form (null when it does not exist)
	async load(id) {
		const doc = await Riven.findById(id).lean().exec();
		if (!doc) return null;
		const conditions = (doc.conditions || []).map(idOf);
		return {
			createdAt: doc.Created_date,
			lockedReason: null,
			values: {
				type: idOf(doc.type),
				source: idOf(doc.source),
				weaponName: doc.weaponName || '',
				mandatoryCondition: conditions[0] || '',
				N: doc.N !== undefined && doc.N !== null ? String(doc.N) : '',
				optionalConditions: conditions.slice(1)
			}
		};
	},
	// the mandatory condition is the first one of the riven "conditions" ; id : the record to update (edit form)
	save: (values, userId, id) => RivenProcess.addOrUpdate({
		...(id ? { _id: id } : {}),
		type: values.type,
		source: values.source,
		weaponName: values.weaponName,
		N: values.N,
		conditions: values.mandatoryCondition
			? [values.mandatoryCondition, ...(values.optionalConditions || [])]
			: []
	}, userId)
};
