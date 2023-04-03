
// We need rewardScripts.js and a reward variable from server-side and pug template
window.onload = function() {
    //onSelect($('type'));
    if (reward.booster || reward.riven) {
        nodeClone = _('container').firstChild;
    }
    if (reward.rivenType) {
        _('mand-span').onclick = function() {
            addOptional(this)
        };
    }
    if (reward.riven && reward.riven.conditions) {
        let nbcond = reward.riven.conditions.length;
        if (nbcond > 1) {
            indexClone = nbcond - 1;
            for (let i = 1; i < nbcond; i++) {
                _('condition-row'+i).getElementsByTagName('span')[0].onclick = removeRow;
                _('condition-row'+i).getElementsByTagName('span')[1].onclick = addRow;
            }
        }
    }
};
