let indexClone = 0;
let nodeClone = 0;
const cloneLimit = 5;

function _(id) { return document.getElementById(id); }

function validateForm() {
    const mcond = _('mcondition');
    if (mcond && mcond.value === 'none' && indexClone > 0) {
        alert('No mandatory condition is selected');
        return false;
    }
    const date = _('date');
    if (date.value.length === 0) {
        alert('Should have a date');
        return false;
    }
    return true;
}

function resetDate() {
    _('date').value = '';
    return false;
}

function onSelect(combo) {
    const text = combo.options[combo.selectedIndex].innerHTML;
    const destination = _('container');
    if (nodeClone) {
        destination.removeChild(nodeClone);
        nodeClone = undefined;
    }
    if (text.search('Booster') >= 0) {
        const original = _('boosters');
        nodeClone = original.cloneNode(true);
        nodeClone.hidden = false;
        destination.appendChild(nodeClone);
    } else if (text.search('Riven') >= 0) {
        indexClone = 0;
        const original = _('riven-example');
        nodeClone = original.cloneNode(true);
        nodeClone.id = 'riven';
        nodeClone.hidden = false;
        // div mandatory condition + button
        nodeClone.childNodes[2].childNodes[0].htmlFor = 'mcondition';
        nodeClone.childNodes[2].childNodes[1].id = 'mcondition';
        nodeClone.childNodes[2].childNodes[2].id = 'mand-span';
        nodeClone.childNodes[2].childNodes[2].onclick = function () {
            addOptional(this);
        }
        // div optional conditions array
        nodeClone.childNodes[4].id = 'condition-rows';
        destination.appendChild(nodeClone);
    }
}

/**
 * Special case for the Mandatory ComboBox
 */
function addOptional(param) {
    param.hidden = true;
    addRow();
}

/**
 * Add a ComboBox and its buttons after the others and hide the penultimate ComboBox' buttons.
 */
function addRow() {
    // CLONE THE COMBO BOX + BUTTONS
    const original = _('condition-example');
    const clone = original.cloneNode(true);
    clone.id = 'condition-row' + ++indexClone;
    clone.getElementsByTagName('label')[0].innerHTML = 'Optional Condition '+indexClone+' : ';
    clone.getElementsByTagName('label')[0].htmlFor = 'cond-select'+indexClone;
    clone.getElementsByTagName('select')[0].id = 'cond-select'+indexClone;
    clone.hidden = false;
    // MODIFY BUTTONS
    clone.getElementsByTagName('span')[0].onclick = removeRow;
    if (indexClone >= cloneLimit)
        clone.getElementsByTagName('span')[1].hidden = true;
    else
        clone.getElementsByTagName('span')[1].onclick = addRow;
    // ADD THE CLONE TO THE DESTINATION DIV
    const destination = _('condition-rows');
    destination.appendChild(clone);
    // HIDE THE BUTTONS OF THE PREVIOUS SELECT
    if (indexClone > 1) {
        const previousClone = _('condition-row' + (indexClone - 1));
        previousClone.getElementsByTagName('span')[0].hidden = true;
        previousClone.getElementsByTagName('span')[1].hidden = true;
    }
}

/**
 * Unhide the penultimate ComboBox' buttons and remove the last ComboBox.
 */
function removeRow() {
    const currentRow = _('condition-row'+indexClone);
    indexClone--;
    if (indexClone > 0) {
        const previousRow = _('condition-row'+ indexClone);
        previousRow.getElementsByTagName('span')[0].hidden = false;
        previousRow.getElementsByTagName('span')[1].hidden = false;

    } else {
        _('mand-span').hidden = false;
    }
    currentRow.remove();
}

$(document).ready(function () {
    $('#date').datepicker({
        dateFormat: 'yy-mm-dd',
        onSelect: function () {
            $('#formOptions').submit();
        }
    });
    _('resetDate').onclick = resetDate;
    _('type').onchange = function () { onSelect(this); }
    _('rewardForm').onsubmit = function () { return validateForm(); }
});
