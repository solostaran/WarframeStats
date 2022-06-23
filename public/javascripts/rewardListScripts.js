
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

function next(totalCount) {
    let offset = Number($('#offset').val());
    let newBegin = offset + Number($('#nb').val());
    if (newBegin >= totalCount) newBegin = totalCount - 1;
    $('#offset').val( newBegin );
    return true;
}

function last(totalCount) {
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

