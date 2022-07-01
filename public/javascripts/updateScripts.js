
// We need rewardScripts.js and a reward variable from server-side and pug template
window.onload = function() {
    //onSelect($('type'));
    if (reward.booster || reward.riven) {
        nodeClone = _('container').firstChild;
    }
    if (reward.riven && reward.riven.conditions) {
        if (reward.riven.conditions.length > 1)
            indexClone = reward.riven.conditions.length - 1;
    }
};
