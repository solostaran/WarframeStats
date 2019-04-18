
function $(id) { return document.getElementById(id); }

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
}

function addAdvice() {
    const div = $('advices');
    const nb = div.getElementsByTagName('div').length + 1;
    if (nb > 10) return false;
    const nodeClone = $('div-advice-example').cloneNode(true);
    nodeClone.hidden = false;
    nodeClone.id = 'div-advice'+nb;
    nodeClone.childNodes[0].htmlFor = 'advice'+nb;
    nodeClone.childNodes[0].innerHTML = "Advice "+nb+" :";
    nodeClone.childNodes[1].id = 'advice'+nb;
    div.appendChild(nodeClone);
    return false;
}

function removeAdvice() {
    const div = $('advices');
    const list = div.getElementsByTagName('div');
    if (list.length > 0) list[list.length - 1].remove();
    return false;
}