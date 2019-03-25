'use strict'

// Convert Excel dates into JS date objects
// @ref https://gist.github.com/christopherscott/2782634
// @param excelDate {Number}
// @return {Date}
function getJsDateFromExcel(excelDate) {

    // JavaScript dates can be constructed by passing milliseconds
    // since the Unix epoch (January 1, 1970) example: new Date(12312512312);

    // 1. Subtract number of days between Jan 1, 1900 and Jan 1, 1970, plus 1 (Google "excel leap year bug")
    // 2. Convert to milliseconds.

    return new Date((excelDate - (25567 + 2))*86400*1000); // ... +2 because it works better than +1 !

}

function value2date(val) {
    // Convert a date either from Excel (aka an integer since Unix Epoch) or in "aaaa/mm/dd" format.
    if (isNaN(val)) {
        // date in format : aaaa/mm/dd
        const split = val.split('/');
        return new Date(Date.UTC(split[0], split[1] - 1, split[2], 12));
    } else {
        // excel date in number since January 1, 1970
        return new Date((val - (25567 + 2))*86400*1000); // ... +2 because it works better than +1 !
    }
}

function date2string(d) {
    const split = d.toISOString().split(/\D/);
    return split[0]+'/'+split[1]+'/'+split[2];
}

exports.value2date = value2date;
exports.date2string = date2string;