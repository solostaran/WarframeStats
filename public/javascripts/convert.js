
function date2string(d) {
    const split = d.toISOString().split('/\D/');
    return split[0]+'/'+split[1]+'/'+split[2];
}
