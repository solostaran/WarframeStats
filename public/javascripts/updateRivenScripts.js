
// We need rivenScripts.js and a riven variable from server-side and pug template
window.onload = function() {
    //onSelect($('type'));
    if (riven.conditions) {
        if (riven.conditions.length > 1)
            iClone = riven.conditions.length - 1;
    }
};
