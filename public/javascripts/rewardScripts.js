let indexClone = 0;
let nodeClone = 0;
const cloneLimit = 5;

function $(id) { return document.getElementById(id); }

function validateForm(formObj) {
    const riven = $('riven');
    const mcond = $('mcondition');
    if (mcond && mcond.value == 'none' && indexClone > 0) {
        alert('No mandatory condition is selected');
        return false;
    }
    // if (riven && !riven.childNodes[5].value) {
    //     alert('weaponName is empty !');
    //     return false;
    // }
    return true;
}

const floater = new DatePicker();
function toggleDatepicker(selector) {
    floater.toggle(selector);
    //floater.on('change', function(date) {
    //    selector.value = date.toISOString();
    //});
    return false;
}

function resetDate(dateinput) {
    dateinput.value = '';
    return false;
}

function onSelect(combo) {
    const text = combo.options[combo.selectedIndex].innerHTML;
    const destination = $('container');
    if (nodeClone) {
        destination.removeChild(nodeClone);
        nodeClone = undefined;
    }
    if (text.search('Booster') >= 0) {
        const original = $('boosters');
        nodeClone = original.cloneNode(true);
        nodeClone.hidden = false;
        destination.appendChild(nodeClone);
    } else if (text.search('Riven') >= 0) {
        const original = $('riven-example');
        nodeClone = original.cloneNode(true);
        nodeClone.id = 'riven';
        nodeClone.hidden = false;
        nodeClone.childNodes[8].htmlFor = 'mcondition';
        nodeClone.childNodes[9].id = 'mcondition';
        nodeClone.childNodes[10].id = 'mand-span';
        nodeClone.childNodes[13].id = 'condition-rows';
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
    const original = $('condition-example');
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
    const destination = $('condition-rows');
    destination.appendChild(clone);
    // HIDE THE BUTTONS OF THE PREVIOUS SELECT
    if (indexClone > 1) {
        const previousClone = $('condition-row' + (indexClone - 1))
        previousClone.getElementsByTagName('span')[0].hidden = true;
        previousClone.getElementsByTagName('span')[1].hidden = true;
    }
}

/**
 * Unhide the penultimate ComboBox' buttons and remove the last ComboBox.
 */
function removeRow(obj) {
    const currentRow = $('condition-row'+indexClone);
    indexClone--;
    if (indexClone > 0) {
        const previousRow = $('condition-row'+ indexClone);
        previousRow.getElementsByTagName('span')[0].hidden = false;
        previousRow.getElementsByTagName('span')[1].hidden = false;

    } else {
        $('mand-span').hidden = false;
    }
    currentRow.remove();
}
