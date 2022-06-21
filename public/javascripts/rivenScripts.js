let iClone = 0;
const cloneLimit = 5;

function validateForm(formObj) {
    if (document.getElementById('mcondition').value === 'none' && iClone > 0) {
        alert('No mandatory condition is selected');
        return false;
    }
    if (!formObj.weaponName.value) {
        alert('weaponName is empty !');
        return false;
    }
    return true;
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
    const original = document.getElementById('condition-exemple');
    const clone = original.cloneNode(true);
    clone.id = 'condition-row' + ++iClone;
    clone.getElementsByTagName('label')[0].innerHTML = 'Optional condition '+iClone+' : ';
    clone.getElementsByTagName('label')[0].htmlFor = 'cond-select'+iClone;
    clone.getElementsByTagName('select')[0].id = 'cond-select'+iClone;
    clone.hidden = false;
    // MODIFY BUTTONS
    clone.getElementsByTagName('span')[0].onclick = removeRow;
    if (iClone >= cloneLimit)
        clone.getElementsByTagName('span')[1].hidden = true;
    else
        clone.getElementsByTagName('span')[1].onclick = addRow;
    // ADD THE CLONE TO THE DESTINATION DIV
    const destination = document.getElementById('condition-rows');
    destination.appendChild(clone);
    // HIDE THE BUTTONS OF THE PREVIOUS SELECT
    if (iClone > 1) {
        const previousClone = document.getElementById('condition-row' + (iClone - 1));
        previousClone.getElementsByTagName('span')[0].hidden = true;
        previousClone.getElementsByTagName('span')[1].hidden = true;
    }
}

/**
 * Unhide the penultimate ComboBox' buttons and remove the last ComboBox.
 */
function removeRow() {
    const currentRow = document.getElementById('condition-row'+iClone);
    iClone--;
    if (iClone > 0) {
        const previousRow = document.getElementById('condition-row'+ iClone);
        previousRow.getElementsByTagName('span')[0].hidden = false;
        previousRow.getElementsByTagName('span')[1].hidden = false;

    } else {
        document.getElementById('mand-span').hidden = false;
    }
    currentRow.remove();
}
