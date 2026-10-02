'use strict';

// Generic forms : a definition (api/forms/definitions/*.js) gives the list of fields.
// The same fields are used to render the modal (views/mixins/formModal.pug)
// and to validate what the browser sends back : the browser is never trusted.
//
// Field : { name, label, type, required, placeholder, min, max, maxLength, options, showIf }
//   type    : 'string' | 'integer' | 'date' | 'select' | 'list' (repeatable select, at most "max" rows)
//   options : [{ value, label }] for 'select' and 'list'
//   showIf  : { field, in: [values] } or { field, notEmpty: true }
//             (data only, evaluated the same way by public/javascripts/formModal.js)

const DEFAULT_MAX_LENGTH = 100;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const INTEGER_PATTERN = /^-?\d+$/;

function isEmpty(value) {
	return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

// "values" only holds the values of the visible fields processed before this one
function isVisible(field, values) {
	const rule = field.showIf;
	if (!rule) return true;
	const value = values[rule.field];
	if (rule.notEmpty) return !isEmpty(value);
	if (Array.isArray(rule.in)) return typeof value === 'string' && rule.in.includes(value);
	return false;
}

function isOption(field, value) {
	return Array.isArray(field.options) && field.options.some(option => option.value === value);
}

function isRealDate(text) {
	const match = DATE_PATTERN.exec(text);
	if (!match) return false;
	const [year, month, day] = match.slice(1).map(Number);
	const date = new Date(Date.UTC(year, month - 1, day));
	return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// returns { value } (undefined value = empty) or { error }
function checkValue(field, raw) {
	if (raw === undefined || raw === null) return { value: undefined };
	switch (field.type) {
		case 'string': {
			if (typeof raw !== 'string') return { error: 'Must be a text' };
			const value = raw.trim();
			if (value.length > (field.maxLength || DEFAULT_MAX_LENGTH)) return { error: 'Too long' };
			return { value: value === '' ? undefined : value };
		}
		case 'integer': {
			if (raw === '') return { value: undefined };
			let value;
			if (typeof raw === 'number' && Number.isInteger(raw)) value = raw;
			else if (typeof raw === 'string' && INTEGER_PATTERN.test(raw.trim())) value = Number(raw.trim());
			else return { error: 'Must be an integer' };
			if (field.min !== undefined && value < field.min) return { error: 'Must be at least ' + field.min };
			if (field.max !== undefined && value > field.max) return { error: 'Must be at most ' + field.max };
			return { value };
		}
		case 'date': {
			if (raw === '') return { value: undefined };
			if (typeof raw !== 'string' || !isRealDate(raw)) return { error: 'Must be a date (YYYY-MM-DD)' };
			return { value: raw };
		}
		case 'select': {
			if (raw === '') return { value: undefined };
			if (typeof raw !== 'string' || !isOption(field, raw)) return { error: 'Invalid choice' };
			return { value: raw };
		}
		case 'list': {
			if (!Array.isArray(raw)) return { error: 'Invalid list' };
			const items = raw.filter(item => item !== '');
			if (items.some(item => typeof item !== 'string' || !isOption(field, item))) return { error: 'Invalid choice' };
			if (field.max !== undefined && items.length > field.max) return { error: 'At most ' + field.max + ' choices' };
			return { value: items };
		}
		default:
			return { error: 'Unknown field type' };
	}
}

// Keeps only the declared and visible fields of "body", checked against their definition.
// returns { values, errors } where errors is { fieldName: message } ("_form" for the whole form)
function validate(fields, body) {
	const values = {};
	const errors = {};
	if (body === null || typeof body !== 'object' || Array.isArray(body)) {
		errors._form = 'Invalid data';
		return { values, errors };
	}
	for (const field of fields) {
		if (!isVisible(field, values)) continue; // a hidden field is ignored, even when it is sent
		const raw = Object.hasOwn(body, field.name) ? body[field.name] : undefined;
		const result = checkValue(field, raw);
		if (result.error) {
			errors[field.name] = result.error;
			continue;
		}
		if (isEmpty(result.value)) {
			if (field.required) errors[field.name] = 'Required';
			continue;
		}
		values[field.name] = result.value;
	}
	return { values, errors };
}

// Mongoose documents -> [{ value, label }]
function toOptions(docs, labelKey = 'name') {
	return docs.map(doc => ({ value: String(doc._id), label: String(doc[labelKey]) }));
}

// Plain data for the PUG mixin "formModal"
function toViewModel(definition, fields) {
	return {
		id: definition.id,
		title: definition.title,
		submitLabel: definition.submitLabel,
		fields: fields
	};
}

exports.isVisible = isVisible;
exports.validate = validate;
exports.toOptions = toOptions;
exports.toViewModel = toViewModel;
