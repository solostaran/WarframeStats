const express = require('express');
require('http-errors');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const debug = require('debug')('warframestats:server');
//var http = require('http-debug').http;
//http.debug = 1;

//Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) console.log('Production configuration.');
else console.log('Development configuration.');

const isNodemon = process.env.NODEMON === 'true';
const isDocker = process.env.DOCKER === 'true';
const isHttp = process.env.HTTP === 'true';

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
app.use(express.static(path.join(__dirname, 'public')));
if (isProduction) {
	app.use(morgan('combined', {
		skip: function (req, res) {
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
	app.use(morgan('dev'))
}

const crypto = require("crypto");
app.use(function(req, res, next) {
	// Maybe use the Helmet middleware instead ?
	// from https://www.npmjs.com/package/helmet
	// and https://www.npmjs.com/package/helmet-csp
	res.locals.nonce = crypto.randomBytes(16).toString("hex");
	res.setHeader('X-Content-Type-Options', 'nosniff');
	res.setHeader('Content-Security-Policy', `default-src 'self' ; img-src 'self' data: https://code.jquery.com ; style-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://code.jquery.com 'unsafe-inline' ; script-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://code.jquery.com 'nonce-${res.locals.nonce}' ; font-src https://cdn.jsdelivr.net ; object-src 'none' ; frame-ancestors 'self'`);
	//res.setHeader('Content-Security-Policy', `default-src 'self' ; img-src 'self' data: https://code.jquery.com ; style-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://code.jquery.com 'unsafe-inline' ; script-src 'self' https://cdn.jsdelivr.net https://unpkg.com https://code.jquery.com 'unsafe-inline' ; font-src https://cdn.jsdelivr.net ; object-src 'none' ; frame-ancestors 'self'`);
	// CSP directive "img-src data:" may be vulnerable to XSS !
	// CSP directive "style-src 'unsafe-inline'" must be explored, but it depends on the 'bootstrap-table' module.
	// CSP directive "script-src ''unsafe-inline'" must be excluded, workaround is to set the onClick via a script. @see https://stackoverflow.com/questions/47021481/content-security-policy-with-dynamic-button
	res.setHeader('X-Frame-Options','SAMEORIGIN');
	res.setHeader('X-XSS-Protection','1; mode=block');
	next()
})

// Configure MONGOOSE (on docker, use a different hostname)
mongoose.Promise = global.Promise;
const db_host = isDocker ? 'net-db-warstats' : '127.0.0.1';
mongoose.connect('mongodb://'+db_host+'/WarframeStatsDB', {useNewUrlParser: true, useUnifiedTopology: true})
	.then(() => {
		debug('Connected to database.');
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
require('./config/passport');


// API ROUTES
const rivenTypeRoute = require('./routes/rivenTypeRoutes');
app.use('/riven/type', rivenTypeRoute);
const rivenSourceRoute = require('./routes/rivenSourceRoutes');
app.use('/riven/source', rivenSourceRoute);
const rivenConditionRoute = require('./routes/rivenConditionRoutes');
app.use('/riven/condition', rivenConditionRoute);
const rivenRoutes = require('./routes/rivenRoutes');
app.use('/riven', rivenRoutes);
const boosterTypeRoute = require('./routes/boosterTypeRoutes');
app.use('/booster/type', boosterTypeRoute);
const rewardTypeRoute = require('./routes/rewardTypeRoutes');
app.use('/reward/type', rewardTypeRoute);
const rewardSourceRoute = require('./routes/rewardSourceRoutes');
app.use('/reward/source', rewardSourceRoute);
const rewardRoute = require('./routes/rewardRoutes');
app.use('/reward', rewardRoute);
const usersRoute = require('./routes/usersRoutes');
app.use('/users', usersRoute);
const worldStateRoute = require('./routes/worldStateRoute');
app.use('/worldState', worldStateRoute);

//app.get('/favicon.ico', (req, res) => res.status(204));

// XLSX 2 JSON
const enhancedExcel2json = require('./excel2json/enhancedExcel2json.js');
app.post('/enhanced-excel-to-json', function(req, res) {
	enhancedExcel2json(
		req.body,
		function (err, output) {
			if (err) {
				if (output)
					res.status(400).json(output);
				else
					res.status(400).json(err);
			}
			else
				res.json(output);
		});
});

// Views
app.use('/', require('./routes/index'));
app.use('/types', require('./routes/rivenTypesRoutes'));
app.use('/sources', require('./routes/rivenSourcesRoutes'));
app.use('/conditions', require('./routes/conditionsRoutes'));
app.use('/rivenForm', require('./routes/rivenFormRoute'));
app.use('/rewardForm', require('./routes/rewardFormRoutes'));
app.use('/boosters', require('./routes/boostersRoutes'));
app.use('/stats', require('./routes/statsRoutes'));

// 404 management
app.use(function(req, res, next) {
	//res.status(404).send({url: req.originalUrl + ' not found'})
	res.render('404', { url: req.originalUrl });
	next();
});

// error handler excepting 404
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

if (isNodemon) {
	const PORT = 3000;
	app.listen(PORT, () => console.log('Server running on http://localhost:'+PORT+'/'));
} else {
	module.exports = app;
}
debug('RESTful API server started.');
