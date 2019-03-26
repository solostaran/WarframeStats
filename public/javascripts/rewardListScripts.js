
function $(id) { return document.getElementById(id); }

function previous() {
    let hiddenOffset = $('offset');
    let newBegin = Number(hiddenOffset.value) - Number($('nb').value);
    if (newBegin < 0) newBegin = 0;
    hiddenOffset.value = newBegin;
    return true;
}

function next() {
    let hiddenOffset = $('offset');
    let newBegin = Number(hiddenOffset.value) + Number($('nb').value);
    hiddenOffset.value = newBegin;
    return true;
}

function onChangeNb() {
    if (isNaN($('nb').value) || Number($('nb').value < 0))
        $('nb').value = 20;
}