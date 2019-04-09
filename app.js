const express = require('express');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
//var http = require('http-debug').http;
//http.debug = 1;
const http = require('http');
const https = require('https');
const fs = require('fs');

var options = {
    key: fs.readFileSync('keys/client-key.pem'),
    cert: fs.readFileSync('keys/client-cert.pem')
};

var app = express();

http.createServer(app).listen(80)
https.createServer(options, app).listen(443);

// MONGODB SCHEMAS
const mongoose = require('mongoose'),
    RivenType = require('./api/models/rivenTypeModel.js'),
    RivenCondition = require('./api/models/rivenConditionModel.js'),
    Riven = require('./api/models/rivenModel.js'),
    BoosterType = require('./api/models/boosterTypeModel.js'),
    RewardType = require('./api/models/rewardTypeModel.js'),
    SortieReward = require('./api/models/sortieRewardModel.js'),
    bodyParser = require('body-parser');
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/WarframeStatsDB', { useNewUrlParser: true });

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

// XLSX 2 JSON

//const excel2json = require('node-excel-to-json'); // original excel-to-json, unused
// var options = {
//     convert_all_sheet: false, // If this value is false, Then one sheet will processed which name would be provided
//     return_type: 'Object', // Two type of return type 'File' or 'Object'
//     sheetName: 'Feuil1', // Only if convert_all_sheet=false
//     check_array : false, // If this value is true, then a header with [] at the end means that the value is an array
//     separator: ';' // Only if check_array=true, split the value with this separator
// }

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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const indexRouter = require('./routes/index'),
    typesRouter = require('./routes/typesRoutes'),
    conditionsRouter = require('./routes/conditionsRoutes'),
    rivenFormRouter = require('./routes/rivenFormRoute'),
    rewardFormRouter = require('./routes/rewardFormRoutes'),
    boostersRouter = require('./routes/boostersRoutes'),
    statsRouter = require('./routes/statsRoutes');

app.use('/', indexRouter);
app.use('/types', typesRouter);
app.use('/conditions', conditionsRouter);
app.use('/rivenForm', rivenFormRouter);
app.use('/rewardForm', rewardFormRouter);
app.use('/boosters', boostersRouter);
app.use('/stats', statsRouter);

app.use(function(req, res) {
    //res.status(404).send({url: req.originalUrl + ' not found'})
    res.render('404', { url: req.originalUrl });
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

console.log('WarframeStats RESTful API server started.');