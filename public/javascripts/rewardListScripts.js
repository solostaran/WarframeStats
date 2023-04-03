
function _(id) { return document.getElementById(id); }
function previous() {
    let newBegin = Number($('#offset').val()) - Number($('#nb').val());
    if (newBegin < 0) newBegin = 0;
    $('#offset').val( newBegin );
    return true;
}

function first() {
    $('#offset').val( 0 );
    return true;
}

function next() {
    let offset = Number($('#offset').val());
    let newBegin = offset + Number($('#nb').val());
    if (newBegin >= totalCount) newBegin = totalCount - 1;
    $('#offset').val( newBegin );
    return true;
}

function last() {
    $('#offset').val( totalCount - Number($('#nb').val()) );
    return true;
}

function onChangeNb() {
    if (isNaN($('#nb').val()) || Number($('#nb').val()) < 0)
        $('#nb').val( 20 );
    $('#formOptions').submit();
}

function resetDate(that) {
    if (that.value) {
        that.value = "";
        $('#formOptions').submit();
    }
    return false;
}

function onSelect(combo) {
    //const text = combo.options[combo.selectedIndex].innerHTML;
    $('#formOptions').submit();
}

// cf. https://jqueryui.com/datepicker/
$(document).ready(function() {
    $('#startDate').datepicker({
        dateFormat:'yy-mm-dd',
        onSelect: function(d) {
            $('#formOptions').submit();
        }
    });
    $('#endDate').datepicker({
        dateFormat: 'yy-mm-dd',
        onSelect: function (d) {
            $('#formOptions').submit();
        }
    });
    _('resetStartDate').onclick = function () {resetDate(_('startDate'))};
    _('resetEndDate').onclick = function () {resetDate(_('endDate'))};
    _('first').onclick = first;
    _('previous').onclick = previous;
    _('next').onclick = next;
    _('last').onclick = last;
    _('perType').onchange = function () { onSelect(this); }
    _('nb').onchange = onChangeNb;
});
