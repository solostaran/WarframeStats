
function _(id) { return document.getElementById(id); }

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
}

function addAdvice() {
    const div = _('advices');
    const nb = div.getElementsByTagName('div').length + 1;
    if (nb > 10) return false;
    const nodeClone = _('div-advice-example').cloneNode(true);
    nodeClone.hidden = false;
    nodeClone.id = 'div-advice'+nb;
    nodeClone.childNodes[0].htmlFor = 'advice'+nb;
    nodeClone.childNodes[0].innerHTML = "Advice "+nb+" :";
    nodeClone.childNodes[1].id = 'advice'+nb;
    div.appendChild(nodeClone);
    if (nb === 10) _('add').disabled = true;
    _('remove').disabled = false;
    return false;
}

function removeAdvice() {
    const div = _('advices');
    const list = div.getElementsByTagName('div');
    if (list.length > 0) list[list.length - 1].remove();
    if (list.length === 0) _('remove').disabled = true
    _('add').disabled = false;
    return false;
}

window.onload = function() {
    _('add').onclick = addAdvice;
    _('remove').onclick = removeAdvice;
}
