
function $(id) { return document.getElementById(id); }

function previous() {
    let hiddenOffset = $('offset');
    let newBegin = Number(hiddenOffset.value) - Number($('nb').value);
    if (newBegin < 0) newBegin = 0;
    hiddenOffset.value = newBegin;
    return true;
}

function first() {
    let hiddenOffset = $('offset');
    hiddenOffset.value = 0;
    return true;
}

function next() {
    let hiddenOffset = $('offset');
    hiddenOffset.value = Number(hiddenOffset.value) + Number($('nb').value);
    return true;
}

function last(totalCount) {
    let hiddenOffset = $('offset');
    hiddenOffset.value = totalCount - $('nb').value;
    return true;
}

function onChangeNb() {
    if (isNaN($('nb').value) || Number($('nb').value) < 0)
        $('nb').value = 20;
    $('formOptions').submit();
}

const floater1= new DatePicker();
floater1.on('change', function(date) {
    let tempDate = date.toISOString().split('-').join('/').substring(0, 10);
    if ($('dateHigh').value && tempDate > $('dateHigh').value) {
        alert('Wrong date selection');
    } else {
        $('dateLow').value = tempDate;
        $('formOptions').submit();
    }
});
function toggleDatepicker1(selector) {
    floater1.toggle(selector);
    return false;
}
const floater2= new DatePicker();
floater2.on('change', function(date) {
    let tempDate = date.toISOString().split('-').join('/').substring(0, 10);
    if ($('dateLow').value && $('dateLow').value > tempDate) {
        alert('Wrong date selection');
    } else {
        $('dateHigh').value = tempDate;
        $('formOptions').submit();
    }
});
function toggleDatepicker2(selector) {
    floater2.toggle(selector);
    return false;
}

function resetDate(that) {
    if (that.value) {
        that.value = "";
        $('formOptions').submit();
    }
    return false;
}

function onSelect(combo) {
    //const text = combo.options[combo.selectedIndex].innerHTML;
    $('formOptions').submit();
}
