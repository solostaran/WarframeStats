'use strict';

// Compares the client-side pagination ("/rewards", all rows from /reward/raw)
// and the server-side pagination ("/rewardsPaged", one page from /reward/paged).
//
//   BASE_URL=http://localhost:3000 node tests/fixtures/perfRewards.js [--runs=5] [--api-runs=20]
//
// Needs the app running (BASE_URL, default http://localhost:3000) and Playwright's browser :
//   npx playwright install chromium-headless-shell
// Exit code 1 when both pages don't show the same number of rows as the server.

const { chromium } = require('playwright');

const BASE_URL = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
const option = (name, def) => {
	const arg = process.argv.find(a => a.startsWith(`--${name}=`));
	return arg ? Number.parseInt(arg.split('=')[1], 10) : def;
};
const RUNS = option('runs', 5);
const API_RUNS = option('api-runs', 20);
const FILTER_TYPE = 'Riven Mod';

const median = list => list.slice().sort((a, b) => a - b)[Math.floor(list.length / 2)];
const round = n => Math.round(n * 10) / 10;

async function getJson(path) {
	const res = await fetch(BASE_URL + path);
	if (!res.ok) throw new Error(`${path} : HTTP ${res.status}`);
	return res.json();
}

// 1. the data routes alone : response time and size
async function measureRoute(path) {
	const times = [];
	let size = 0;
	for (let i = 0; i < API_RUNS; i++) {
		const start = performance.now();
		const res = await fetch(BASE_URL + path);
		size = (await res.arrayBuffer()).byteLength;
		times.push(performance.now() - start);
	}
	return { 'median (ms)': round(median(times)), 'min (ms)': round(Math.min(...times)),
		'max (ms)': round(Math.max(...times)), 'size (KB)': round(size / 1024) };
}

// 2. a page in a browser : ready, next page, Type filter
async function measurePage(browser, path, expected) {
	const ready = [], next = [], filter = [];
	const totals = new Set();
	const info = () => document.querySelector('.pagination-info').textContent;
	const total = text => Number((/of (\d+) rows/.exec(text) || [])[1]);
	for (let run = 0; run < RUNS; run++) {
		// a fresh context (no cache), tall enough for the fixed footer not to cover the pagination
		const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } });
		const page = await context.newPage();
		const typeSelect = 'select.bootstrap-table-filter-control-type\\.name';

		// the table events, timed from the navigation start (performance.now() in the page)
		await page.addInitScript(() => {
			window.__tableEvents = [];
			document.addEventListener('DOMContentLoaded', () => $('#table').on('all.bs.table',
				() => window.__tableEvents.push(performance.now())));
		});
		await page.goto(BASE_URL + path);
		// rows shown and the Type select filled, then no table event for 1 s : the table is usable.
		// (after loading, the filter-control extension runs a delayed search per select column,
		// each one going back to page 1 : a click before them would be undone)
		await page.waitForFunction(select => /of [1-9]\d* rows/.test(document.querySelector('.pagination-info')?.textContent || '')
			&& (document.querySelector(select)?.options.length || 0) > 1, typeSelect, { timeout: 120000 });
		await page.waitForFunction(() => performance.now() - window.__tableEvents.at(-1) > 1000, null, { timeout: 120000 });
		ready.push(await page.evaluate(() => window.__tableEvents.at(-1)));	// the last event, without the quiet second
		totals.add(total(await page.evaluate(info)));

		const before = await page.evaluate(info);
		let start = performance.now();
		await page.click('.page-item:not(.page-pre) >> text="2"');
		await page.waitForFunction(text => document.querySelector('.pagination-info').textContent !== text, before);
		next.push(performance.now() - start);

		const value = await page.$eval(typeSelect, (s, name) => [...s.options].find(o => o.text === name).value, FILTER_TYPE);
		start = performance.now();
		await page.selectOption(typeSelect, value);
		await page.waitForFunction(n => new RegExp(`of ${n} rows`).test(document.querySelector('.pagination-info').textContent),
			expected.filtered, { timeout: 120000 });
		filter.push(performance.now() - start);

		await context.close();
	}
	return {
		result: { 'page ready (ms)': Math.round(median(ready)), 'next page (ms)': Math.round(median(next)),
			[`"${FILTER_TYPE}" filter (ms)`]: Math.round(median(filter)), 'rows shown': [...totals].join(', ') },
		consistent: totals.size === 1 && totals.has(expected.total)
	};
}

async function main() {
	// what the server says : the reference for both pages
	const types = await getJson('/reward/type/');
	const type = types.find(t => t.name === FILTER_TYPE);
	if (!type) throw new Error(`No reward type "${FILTER_TYPE}"`);
	const expected = {
		total: (await getJson('/reward/paged?limit=1')).total,
		filtered: (await getJson('/reward/paged?limit=1&filter=' + encodeURIComponent(JSON.stringify({ 'type.name': type._id })))).total
	};
	console.log(`${BASE_URL} : ${expected.total} rewards, ${expected.filtered} "${FILTER_TYPE}"`);
	console.log(`Data routes (${API_RUNS} calls each), pages (median of ${RUNS} fresh browsers)\n`);

	const lastPage = Math.floor((expected.total - 1) / 10) * 10;
	const routes = {};
	for (const path of ['/reward/raw', '/reward/paged', `/reward/paged?offset=${lastPage}`])
		routes[path] = await measureRoute(path);
	console.table(routes);

	const browser = await chromium.launch();
	const pages = {};
	let consistent = true;
	try {
		for (const path of ['/rewards', '/rewardsPaged']) {
			const measure = await measurePage(browser, path, expected);
			pages[path] = measure.result;
			consistent = consistent && measure.consistent;
		}
	} finally {
		await browser.close();
	}
	console.table(pages);
	if (!consistent) {
		console.error(`A page doesn't show the ${expected.total} rows of the server.`);
		process.exitCode = 1;
	}
}

main().catch(err => {
	if (err.cause && err.cause.code === 'ECONNREFUSED')
		console.error(`The app is not running at ${BASE_URL} (set BASE_URL).`);
	else if (/Executable doesn't exist/.test(err.message))
		console.error('Playwright browser missing : npx playwright install chromium-headless-shell');
	else
		console.error(err);
	process.exitCode = 1;
});
