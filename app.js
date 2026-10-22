/*
 * DEPENDENCIES
 */
const express = require('express');
require('http-errors');
const path= require('path');
const bodyParser= require('body-parser');
const cookieParser= require('cookie-parser');
const morgan= require('morgan');
const mongoose= require('mongoose');
const debug = require('debug')('warframestats:server');
const crypto= require('crypto');

/*
 * ENVIRONMENT VARIABLES
 */
// Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) console.log('Production configuration.');
else console.log('Development configuration.');

const isNodemon = process.env.NODEMON === 'true';
const isDocker = process.env.DOCKER === 'true';
const isHttp = process.env.HTTP === 'true';

/*
 * GENERAL APPLICATION SETUP
 */
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Configure app
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('./security/sanitizeBody'));	// no "$" operator keys in req.body (NoSQL injection)
app.use(express.static(path.join(__dirname, 'static')));
app.use(require('./security/loginState'));	// res.locals.connected, per request, for the PUG templates
app.locals.safeJson = require('./security/safeJson');	// JSON inlined in a <script> of a template
app.locals.version = require('./package.json').version;	// app version, shown in the footer of the layouts

/*
 * SETUP LOG
 */
if (isProduction) {
	app.use(morgan('combined', {
		skip: function (_req, res) {
			return res.statusCode < 400
		}
	}))
	if (!isHttp) {
		// HTTPS -> HSTS header
		app.use(function(req, res, next) {
			if (req.secure) {
				res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains') // 2 years
			}
			next()
		})
	}
} else {
	app.use(morgan('dev'));
}

/*
 * SETUP HTTP SECURITY
 */
app.use(function(_req, res, next) {
	// Maybe use the Helmet middleware instead ?
	// from https://www.npmjs.com/package/helmet
	// and https://www.npmjs.com/package/helmet-csp
	res.locals.nonce = crypto.randomBytes(16).toString("hex");
	res.setHeader('X-Content-Type-Options', 'nosniff');
	// every asset (Bootstrap, Bootstrap-Table, Bootstrap-Icons, jQuery) is served locally from /public : no CDN allowed
	res.setHeader('Content-Security-Policy', `default-src 'self' ; img-src 'self' data: ; style-src 'self' 'unsafe-inline' ; script-src 'self' 'nonce-${res.locals.nonce}' ; font-src 'self' ; object-src 'none' ; frame-ancestors 'self'`);
	//res.setHeader('Content-Security-Policy', `default-src 'self' ; img-src 'self' data: https://code.jquery.com ; style-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://code.jquery.com 'unsafe-inline' ; script-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://code.jquery.com 'unsafe-inline' ; font-src https://cdn.jsdelivr.net ; object-src 'none' ; frame-ancestors 'self'`);
	// CSP directive "img-src data:" may be vulnerable to XSS !
	// CSP directive "style-src 'unsafe-inline'" must be explored, but it depends on the 'bootstrap-table' module.
	// CSP directive "script-src ''unsafe-inline'" must be excluded, workaround is to set the onClick via a script. [DONE] @see https://stackoverflow.com/questions/47021481/content-security-policy-with-dynamic-button
	res.setHeader('X-Frame-Options','SAMEORIGIN');
	res.setHeader('X-XSS-Protection','1; mode=block');
	next()
})

/*
 * Configure MONGOOSE
 * on docker, use a different hostname
 */
mongoose.Promise = global.Promise;
const db_host = isDocker ? 'net-db-warstats' : '127.0.0.1';
// migrations of the data before serving any request (bin/www waits for app.dbReady)
const dbReady = mongoose.connect('mongodb://'+db_host+'/WarframeStatsDB', {family:4})
	.then(async () => {
		debug('Connected to database.');
		const migrations = require('./database/migrations');
		await migrations.migrate();
		app.locals.dbEmpty = await migrations.isEmpty();	// banner of layout.pug, until a restart
	})
	.catch((err) => {
		debug(err.message);
		process.exit(-2);
	});
if (!isProduction) mongoose.set('debug', true);

// Mongoose Schemas
require('./api/models/rivenTypeModel');
require('./api/models/rivenSourceModel');
require('./api/models/rivenConditionModel');
require('./api/models/rivenModel');
require('./api/models/boosterTypeModel');
require('./api/models/rewardTypeModel');
require('./api/models/rewardSourceModel');
require('./api/models/rewardModel');
require('./api/models/Users');
require('./api/models/netracellModel');
require('./api/models/temporalModel');
require('./database/dbVersionModel');
require('./security/passport');


/*
 * API ROUTES
 */
app.use('/riven/type', require('./api/routes/rivenTypeRoutes'));
app.use('/riven/source', require('./api/routes/rivenSourceRoutes'));
app.use('/riven/condition', require('./api/routes/rivenConditionRoutes'));
app.use('/riven', require('./api/routes/rivenRoutes'));
app.use('/booster/type', require('./api/routes/boosterTypeRoutes'));
app.use('/reward/type', require('./api/routes/rewardTypeRoutes'));
app.use('/reward/source', require('./api/routes/rewardSourceRoutes'));
app.use('/reward', require('./api/routes/rewardRoutes'));
app.use('/users', require('./api/routes/usersRoutes'));
app.use('/worldState', require('./web/routes/worldStateRoute'));
app.use('/netracell', require('./api/routes/netracellRoutes'));
app.use('/temporal', require('./api/routes/temporalRoutes'));
app.use('/forms', require('./web/routes/formsRoutes'));
app.use('/details', require('./web/routes/detailsRoutes'));

/*
 * VIEWS
 */
app.use('/', require('./web/routes/index'));
app.use('/types', require('./web/routes/rivenTypesRoutes'));
app.use('/sources', require('./web/routes/rivenSourcesRoutes'));
app.use('/conditions', require('./web/routes/conditionsRoutes'));
app.use('/boosters', require('./web/routes/boostersRoutes'));
app.use('/stats', require('./web/routes/statsRoutes'));
app.use('/', require('./web/routes/formPagesRoutes'));	// /rivens, /rewards, /netracells, /temporalArchimedea

// juste in case : app.get('/favicon.ico', (req, res) => res.status(204));

/*
 * 404 error management
 */
app.use(function(req, res) {
	res.status(404).render('404', { url: req.originalUrl });
});

/*
 * error handler, excepting 404
 */
app.use(function(err, req, res, next) {
	// set locals (specific for express-jwt's UnauthorizedError)
	if (err.name === 'UnauthorizedError')
		res.locals.message = "You are not authorized to access " + req.url;
	else
		res.locals.message = err.message;
	res.locals.error = isProduction ? {} : err; // provide the error only in development

	// render the error page
	res.status(err.status || 500).render('error');

	next();
});

/*
 * Nodemon session
 */
if (isNodemon) {
	const PORT = 3000;
	dbReady.then(() => app.listen(PORT, () => console.log('Server running on http://localhost:'+PORT+'/')));
} else {
	app.dbReady = dbReady;
	module.exports = app;
}

debug('RESTful API server started.');
