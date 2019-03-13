let iClone = 0;

function validateForm(formObj) {
    if (document.getElementById('mcondition').value == 'none' && iClone > 0) {
        alert('No mandatory condition is selected');
        return false;
    }
    if (!formObj.weaponName.value) {
        alert('weaponName is empty !');
        return false;
    }
    return true;
}

function addOptional(param) {
    param.hidden = true;
    const row1 = document.getElementById('cond-row1');
    row1.hidden = false;
    iClone = 1;
    row1.getElementsByTagName('label')[0].innerHTML = 'Optional Condition '+iClone+' : ';
}

function addRow() {
    const original = document.getElementById('cond-row'+iClone);
    const clone = original.cloneNode(true);
    clone.id = "cond-row" + ++iClone;
    clone.getElementsByTagName('label')[0].innerHTML = 'Optional Condition '+iClone+' : ';
    clone.getElementsByTagName('label')[0].htmlFor = 'cond-select'+iClone;
    clone.getElementsByTagName('select')[0].id = 'cond-select'+iClone;
    clone.getElementsByTagName('span')[0].onclick = removeRow;
    clone.getElementsByTagName('span')[1].onclick = addRow;
    original.getElementsByTagName('span')[0].hidden = true;
    original.getElementsByTagName('span')[1].hidden = true;
    original.parentNode.appendChild(clone);
}

function removeRow() {
    const row = document.getElementById('cond-row'+iClone);
    iClone--;
    if (iClone > 0) {
        const prow = document.getElementById('cond-row'+ iClone);
        prow.getElementsByTagName('span')[0].hidden = false;
        prow.getElementsByTagName('span')[1].hidden = false;
        row.remove();
    } else {
        row.getElementsByTagName('select')[0].getElementsByTagName('option')[0].selected = 'selected';
        row.hidden = true;
        document.getElementById('mand-span').hidden = false;
    }
}