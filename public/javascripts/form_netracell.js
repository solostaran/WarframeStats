const NetracellView = $('#NetracellView');
NetracellView.on('show.bs.modal', event => {
	let btn = event.relatedTarget;
	NetracellView.find('.modal-title').html(btn.getAttribute('data-bs-title'));
	//NetracellView.find('.btn-primary').html(btn.getAttribute('data-bs-primary'));
	NetracellView.find('.modal-body input#modal-netra-id').val(btn.getAttribute('data-netra-id'));
	NetracellView.find('.modal-body input#modal-netra-type').val(btn.getAttribute('data-netra-reward'));
	let tau = btn.getAttribute('data-netra-tau');
	NetracellView.find('.modal-body input#modal-netra-tau').val(tau === 'undefined' ? false : tau);
	NetracellView.find('.modal-body input#modal-netra-date').val(btn.getAttribute('data-netra-date').substring(0, 10));
});
$('#NetracellForm .input-group.date').datepicker({
	format: "yyyy-mm-dd",
	startView: 0,
	minViewMode: 0,
	maxViewMode: 1,
	todayBtn: "linked",
	language: "fr"
});
const NetracellForm = $('#NetracellForm');
NetracellForm.on('click', '.btn-primary', event => {
	const nform = $('form#modal-netracell-form');
	const reward = NetracellForm.find('.modal-body select#modal-form-type').val();
	if (reward === 'none') {
		alert('You must choose a reward');
		return;
	}
	const date = NetracellForm.find('.modal-body input#modal-form-date').val();
	if (date.length !== 10) {
		alert('You must choose a date');
		return;
	}
	const tau = NetracellForm.find('.modal-body select#modal-form-tau').val();
	if (!reward.includes('Shard') && tau === 'true') {
		alert('Only shards can be tauforged');
		return;
	}
	nform.submit();
});
