'use strict';

// Display of a date : "aaaa-mm-dd" (UTC)
function date2string(d) {
	const split = d.toISOString().split(/\D/);
	return split[0]+'-'+split[1]+'-'+split[2];
}

exports.date2string = date2string;
