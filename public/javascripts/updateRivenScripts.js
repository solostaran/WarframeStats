
// We need rivenScripts.js and a riven variable from server-side and pug template
window.onload = function() {
    _('mand-span').onclick = function() {
        addOptional(this)
    };
    //onSelect($('type'));
    if (riven.conditions) {
        let nbcond = riven.conditions.length;
        if (nbcond > 1) {
            iClone = nbcond - 1;
            for (let i = 1; i < nbcond; i++) {
                _('condition-row'+i).getElementsByTagName('span')[0].onclick = removeRow;
                _('condition-row'+i).getElementsByTagName('span')[1].onclick = addRow;
            }
        }
    }
}
