// Generic modal forms (views/mixins/formModal.pug) : show/hide rules, list rows and JSON submit.
// The rules are data ({field, in: [...]} or {field, notEmpty: true}), evaluated like api/forms/formEngine.js.
// The server validates everything again : this script only makes the form pleasant to fill.
// API : formModal.create(formId) opens an empty form (POST /forms/<formId>),
//       formModal.edit(formId, id) opens the form filled with a record (GET then PUT /forms/<formId>/<id>).
// On success, the event "formmodal:saved" is dispatched on document (detail : form, id, mode).
(() => {
	'use strict';

	const isEmpty = value => value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

	function isVisible(rule, values) {
		if (!rule) return true;
		const value = values[rule.field];
		if (rule.notEmpty) return !isEmpty(value);
		if (Array.isArray(rule.in)) return typeof value === 'string' && rule.in.includes(value);
		return false;
	}

	function ruleOf(wrapper) {
		const raw = wrapper.dataset.showIf;
		if (!raw) return null;
		try {
			return JSON.parse(raw);
		} catch (e) {
			return { field: '', in: [] }; // unreadable rule : the field stays hidden
		}
	}

	const fieldsOf = form => form.querySelectorAll('[data-field]');
	const rowsOf = wrapper => wrapper.querySelector('[data-list-rows]');
	const maxRowsOf = wrapper => Number(wrapper.querySelector('[data-list-add]').dataset.max) || Infinity;
	const findForm = formId => Array.from(document.querySelectorAll('form[data-form-modal]'))
		.find(form => form.dataset.formModal === formId);

	function valueOf(wrapper) {
		const rows = rowsOf(wrapper);
		if (rows) return Array.from(rows.querySelectorAll('select')).map(select => select.value);
		const control = wrapper.querySelector('input, select');
		return control ? control.value : undefined;
	}

	// Fields are evaluated in order, a rule only sees the visible fields before it (as on the server)
	function applyRules(form) {
		const values = {};
		fieldsOf(form).forEach(wrapper => {
			const visible = isVisible(ruleOf(wrapper), values);
			wrapper.hidden = !visible;
			// a disabled control is neither validated by the browser nor sent
			wrapper.querySelectorAll('input, select, button').forEach(control => { control.disabled = !visible; });
			const add = wrapper.querySelector('[data-list-add]');
			if (add && visible) add.disabled = rowsOf(wrapper).children.length >= maxRowsOf(wrapper);
			if (visible) values[wrapper.dataset.field] = valueOf(wrapper);
		});
	}

	// adds a row to a list field, returns its select (or null when the list is full)
	function addRow(wrapper) {
		const rows = rowsOf(wrapper);
		if (rows.children.length >= maxRowsOf(wrapper)) return null;
		rows.appendChild(wrapper.querySelector('template[data-list-row]').content.cloneNode(true));
		return rows.lastElementChild.querySelector('select');
	}

	function collect(form) {
		const data = {};
		fieldsOf(form).forEach(wrapper => {
			if (wrapper.hidden) return;
			const value = valueOf(wrapper);
			if (!isEmpty(value)) data[wrapper.dataset.field] = value;
		});
		return data;
	}

	// values of a record (GET /forms/<formId>/<id>) put in the controls
	function fill(form, values) {
		fieldsOf(form).forEach(wrapper => {
			const value = values[wrapper.dataset.field];
			if (rowsOf(wrapper)) {
				rowsOf(wrapper).replaceChildren();
				(Array.isArray(value) ? value : []).forEach(item => {
					const select = addRow(wrapper);
					if (select) select.value = String(item);
				});
				return;
			}
			const control = wrapper.querySelector('input, select');
			if (control) control.value = value === undefined || value === null ? '' : String(value);
		});
		applyRules(form);
	}

	function showMessage(form, message, isError) {
		const alert = form.querySelector('[data-form-error]');
		alert.textContent = message;
		alert.hidden = !message;
		alert.classList.toggle('alert-danger', isError !== false);
		alert.classList.toggle('alert-info', isError === false);
	}

	const showFormError = (form, message) => showMessage(form, message, true);

	function clearErrors(form) {
		form.querySelectorAll('.is-invalid').forEach(control => control.classList.remove('is-invalid'));
		form.querySelectorAll('.invalid-feedback').forEach(feedback => {
			feedback.textContent = '';
			feedback.classList.remove('d-block');
		});
		showMessage(form, '', true);
	}

	function showErrors(form, errors) {
		for (const [name, message] of Object.entries(errors)) {
			const wrapper = Array.from(fieldsOf(form)).find(element => element.dataset.field === name);
			if (!wrapper) {
				showFormError(form, String(message));
				continue;
			}
			wrapper.querySelectorAll('input, select').forEach(control => control.classList.add('is-invalid'));
			const feedback = wrapper.querySelector(':scope > .invalid-feedback');
			feedback.textContent = String(message);
			feedback.classList.add('d-block');
		}
	}

	function resetForm(form) {
		form.reset();
		form.querySelectorAll('[data-list-rows]').forEach(rows => rows.replaceChildren());
		clearErrors(form);
		applyRules(form);
	}

	// creation (id empty) or edition of the record "id" : title, submit text and target of the form
	function setMode(form, id) {
		form.dataset.editId = id || '';
		const modal = form.closest('.modal');
		const title = modal ? modal.querySelector('.modal-title') : null;
		if (title) title.textContent = id ? form.dataset.titleEdit : form.dataset.titleCreate;
		form.querySelector('[type=submit]').textContent = id ? form.dataset.submitEdit : form.dataset.submitCreate;
	}

	async function errorOf(response) {
		if (response.status === 401) return { _form: 'You must be logged in (your session may have expired).' };
		try {
			const body = await response.json();
			if (body && body.errors) return body.errors;
		} catch (e) { /* not JSON */ }
		return { _form: 'Error ' + response.status };
	}

	async function submit(form, modal) {
		clearErrors(form);
		if (!form.reportValidity()) return;
		const editId = form.dataset.editId || '';
		const button = form.querySelector('[type=submit]');
		button.disabled = true;
		try {
			const response = await fetch(editId ? form.action + '/' + encodeURIComponent(editId) : form.action, {
				method: editId ? 'PUT' : 'POST',
				credentials: 'same-origin',
				headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
				body: JSON.stringify(collect(form))
			});
			if (response.ok) {
				if (modal) bootstrap.Modal.getOrCreateInstance(modal).hide();
				resetForm(form);
				setMode(form, null);
				document.dispatchEvent(new CustomEvent('formmodal:saved', {
					detail: { form: form.dataset.formModal, id: editId || null, mode: editId ? 'edit' : 'create' }
				}));
				return;
			}
			showErrors(form, await errorOf(response));
		} catch (err) {
			showFormError(form, 'The server cannot be reached.');
		} finally {
			button.disabled = false;
		}
	}

	function create(formId) {
		const form = findForm(formId);
		if (!form) return;
		resetForm(form);
		setMode(form, null);
		const modal = form.closest('.modal');
		if (modal) bootstrap.Modal.getOrCreateInstance(modal).show();
	}

	async function edit(formId, id) {
		const form = findForm(formId);
		if (!form) return;
		resetForm(form);
		setMode(form, id);
		const modal = form.closest('.modal');
		if (modal) bootstrap.Modal.getOrCreateInstance(modal).show();
		const button = form.querySelector('[type=submit]');
		button.disabled = true; // until the record is loaded
		showMessage(form, 'Loading…', false);
		try {
			const response = await fetch(form.action + '/' + encodeURIComponent(id), {
				credentials: 'same-origin',
				headers: { 'Accept': 'application/json' }
			});
			if (form.dataset.editId !== id) return; // another record was opened meanwhile
			if (!response.ok) {
				showErrors(form, await errorOf(response));
				return;
			}
			const body = await response.json();
			if (form.dataset.editId !== id) return;
			showMessage(form, '', true);
			fill(form, body && body.values ? body.values : {});
			button.disabled = false;
		} catch (err) {
			if (form.dataset.editId === id) showFormError(form, 'The server cannot be reached.');
		}
	}

	function init(form) {
		if (form.dataset.formModalReady) return; // already initialized (script included twice)
		form.dataset.formModalReady = 'true';
		const modal = form.closest('.modal');
		form.addEventListener('change', () => applyRules(form));
		form.addEventListener('input', () => applyRules(form));
		form.addEventListener('click', event => {
			const add = event.target.closest('[data-list-add]');
			if (add) {
				addRow(add.closest('[data-field]'));
				applyRules(form);
				return;
			}
			const remove = event.target.closest('[data-list-remove]');
			if (remove) {
				remove.closest('.input-group').remove();
				applyRules(form);
			}
		});
		form.addEventListener('submit', event => {
			event.preventDefault();
			submit(form, modal);
		});
		if (modal) {
			// Avoid "blocked aria-hidden on an element because its descendant retained focus"
			modal.addEventListener('hide.bs.modal', () => {
				if (modal.contains(document.activeElement)) document.activeElement.blur();
			});
		}
		setMode(form, null);
		applyRules(form);
	}

	document.addEventListener('DOMContentLoaded', () => {
		document.querySelectorAll('form[data-form-modal]').forEach(init);
	});

	window.formModal = { create, edit };
})();
