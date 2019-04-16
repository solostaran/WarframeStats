const express = require('express');
require('http-errors');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const mongoose = require('mongoose');
//var http = require('http-debug').http;
//http.debug = 1;

//Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) console.log('Production configuration.');
else console.log('Development configuration.');

const isNodemon = process.env.NODEMON === 'true';

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

// Configure app
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configure MONGOOSE
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/WarframeStatsDB', { useNewUrlParser: true });
if (!isProduction) mongoose.set('debug', true);

// Mongoose Schemas
require('./api/models/rivenTypeModel');
require('./api/models/rivenConditionModel');
require('./api/models/rivenModel');
require('./api/models/boosterTypeModel');
require('./api/models/rewardTypeModel');
require('./api/models/sortieRewardModel');
require('./api/models/Users');
require('./config/passport');


// API ROUTES
const rivenTypeRoute = require('./routes/rivenTypeRoutes');
app.use('/riven/type', rivenTypeRoute);
const rivenConditionRoute = require('./routes/rivenConditionRoutes');
app.use('/riven/condition', rivenConditionRoute);
const rivenRoutes = require('./routes/rivenRoutes');
app.use('/riven', rivenRoutes);
const boosterTypeRoute = require('./routes/boosterTypeRoutes');
app.use('/booster/type', boosterTypeRoute);
const rewardTypeRoute = require('./routes/rewardTypeRoutes');
app.use('/reward/type', rewardTypeRoute);
const sortieRewardRoute = require('./routes/sortieRewardRoutes');
app.use('/reward', sortieRewardRoute);
const usersRoute = require('./routes/usersRoutes');
app.use('/users', usersRoute);

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
app.use('/types', require('./routes/typesRoutes'));
app.use('/conditions', require('./routes/conditionsRoutes'));
app.use('/rivenForm', require('./routes/rivenFormRoute'));
app.use('/rewardForm', require('./routes/rewardFormRoutes'));
app.use('/boosters', require('./routes/boostersRoutes'));
app.use('/stats', require('./routes/statsRoutes'));

// 404 management
app.use(function(req, res) {
    //res.status(404).send({url: req.originalUrl + ' not found'})
    res.render('404', { url: req.originalUrl });
});

// error handler
app.use(function(err, req, res) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = isProduction ? {} : err;

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

if (isNodemon) {
    const PORT = 3000;
    app.listen(PORT, () => console.log('Server running on http://localhost:'+PORT+'/'));
} else {
    module.exports = app;
}
console.log('WarframeStats RESTful API server started.');