'use strict';

// Unit tests of api/domain/convertDates.js (no database)
const { value2date } = require('#root/api/domain/convertDates.js');

describe('value2date()', () => {
	it('converts "YYYY-MM-DD" to that day, at noon UTC', () => {
		expect(value2date('2026-10-22').toISOString()).toBe('2026-10-22T12:00:00.000Z');
	});

	it('converts "YYYY/MM/DD" the same way', () => {
		expect(value2date('2026/01/05').toISOString()).toBe('2026-01-05T12:00:00.000Z');
	});

	it('converts an Excel serial date (days since 1900-01-01)', () => {
		expect(value2date(44197).toISOString()).toBe('2021-01-01T00:00:00.000Z');
	});

	it('converts an Excel serial date given as a string', () => {
		expect(value2date('44197').toISOString()).toBe('2021-01-01T00:00:00.000Z');
	});
});
