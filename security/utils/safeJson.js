'use strict';

// JSON to be inlined in a <script> element of a template, e.g. "var x = !{safeJson(x)};"
// "<" is escaped so that the data can never close the script element ("</script>"),
// U+2028 and U+2029 are escaped because they are line terminators in older JavaScript.
const LINE_SEPARATOR = new RegExp(String.fromCharCode(0x2028), 'g');
const PARAGRAPH_SEPARATOR = new RegExp(String.fromCharCode(0x2029), 'g');

function safeJson(value) {
	return JSON.stringify(value === undefined ? null : value)
		.replace(/</g, '\\u003c')
		.replace(LINE_SEPARATOR, '\\u2028')
		.replace(PARAGRAPH_SEPARATOR, '\\u2029');
}

module.exports = safeJson;
