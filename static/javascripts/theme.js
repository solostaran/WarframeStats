// Bootstrap 5.3 color mode : follows the system dark/light setting, unless a choice was made with the navbar button (#theme-toggle).
// Must be loaded synchronously in <head>, before the stylesheets, to avoid a flash of the wrong theme.
(() => {
	const KEY = 'theme';
	const root = document.documentElement;
	const mq = window.matchMedia('(prefers-color-scheme: dark)');
	const system = () => mq.matches ? 'dark' : 'light';
	const stored = () => {
		try {
			const v = localStorage.getItem(KEY);
			return v === 'dark' || v === 'light' ? v : null;
		} catch (e) {
			return null;
		}
	};
	const apply = () => root.setAttribute('data-bs-theme', stored() || system());

	apply();
	mq.addEventListener('change', apply);
	// another tab changed the choice
	window.addEventListener('storage', e => { if (e.key === KEY) apply(); });

	document.addEventListener('DOMContentLoaded', () => {
		const btn = document.getElementById('theme-toggle');
		if (!btn) return;
		btn.addEventListener('click', () => {
			const next = root.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
			try {
				// choosing the system mode removes the choice : the site follows the system again
				if (next === system()) localStorage.removeItem(KEY);
				else localStorage.setItem(KEY, next);
			} catch (e) {
				// storage unavailable : the choice lasts for this page only
			}
			root.setAttribute('data-bs-theme', next);
		});
	});
})();
