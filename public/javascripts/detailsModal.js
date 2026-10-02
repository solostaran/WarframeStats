// Read-only "More info" modal (views/mixins/detailsModal.pug) : window.detailsModal.show(kind, id)
// The data comes from GET /details/:kind/:id (api/details) and is only written with textContent/value.
(() => {
	'use strict';

	let lastRequest = 0; // a late answer is ignored when another "More info" was clicked meanwhile

	function elements() {
		const modal = document.getElementById('details-modal');
		if (!modal) return null;
		return {
			modal,
			title: modal.querySelector('.modal-title'),
			message: modal.querySelector('[data-details-message]'),
			body: modal.querySelector('[data-details-body]'),
			value: modal.querySelector('template[data-details-value]'),
			list: modal.querySelector('template[data-details-list]'),
			row: modal.querySelector('template[data-details-list-row]')
		};
	}

	function showMessage(el, text, isError) {
		el.message.textContent = text;
		el.message.hidden = !text;
		el.message.classList.toggle('alert-danger', isError === true);
		el.message.classList.toggle('alert-info', isError !== true);
	}

	function renderValue(el, block, id) {
		const node = el.value.content.cloneNode(true);
		const label = node.querySelector('label');
		const input = node.querySelector('input');
		label.textContent = String(block.label);
		label.htmlFor = id;
		input.id = id;
		input.value = String(block.value);
		el.body.appendChild(node);
	}

	function renderList(el, block, id) {
		const node = el.list.content.cloneNode(true);
		const label = node.querySelector('.col-form-label');
		label.textContent = String(block.label);
		label.id = id;
		node.querySelector('table').setAttribute('aria-labelledby', id);
		const tbody = node.querySelector('tbody');
		block.list.forEach(entry => {
			const row = el.row.content.cloneNode(true);
			row.querySelector('span').textContent = String(entry.text);
			const ul = row.querySelector('ul');
			(Array.isArray(entry.items) ? entry.items : []).forEach(item => {
				const li = document.createElement('li');
				li.textContent = String(item);
				ul.appendChild(li);
			});
			if (ul.children.length === 0) ul.remove();
			tbody.appendChild(row);
		});
		el.body.appendChild(node);
	}

	function render(el, data) {
		el.title.textContent = String(data.title || 'Details');
		data.blocks.forEach((block, index) => {
			const id = 'details-field-' + index;
			if (Array.isArray(block.list)) renderList(el, block, id);
			else renderValue(el, block, id);
		});
	}

	async function show(kind, id) {
		const el = elements();
		if (!el) return;
		const request = ++lastRequest;
		el.title.textContent = 'Details';
		el.body.replaceChildren();
		showMessage(el, 'Loading…', false);
		bootstrap.Modal.getOrCreateInstance(el.modal).show();
		try {
			const response = await fetch('/details/' + encodeURIComponent(kind) + '/' + encodeURIComponent(id), {
				credentials: 'same-origin',
				headers: { 'Accept': 'application/json' }
			});
			if (!response.ok) throw new Error('HTTP ' + response.status);
			const data = await response.json();
			if (request !== lastRequest) return;
			if (!data || !Array.isArray(data.blocks)) throw new Error('Invalid data');
			showMessage(el, '', false);
			render(el, data);
		} catch (err) {
			if (request === lastRequest) showMessage(el, 'Details not available.', true);
		}
	}

	document.addEventListener('DOMContentLoaded', () => {
		const modal = document.getElementById('details-modal');
		// Avoid "blocked aria-hidden on an element because its descendant retained focus"
		if (modal) modal.addEventListener('hide.bs.modal', () => {
			if (modal.contains(document.activeElement)) document.activeElement.blur();
		});
	});

	window.detailsModal = { show };
})();
