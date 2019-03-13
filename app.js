var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

// MONGODB SCHEMAS
const mongoose = require('mongoose'),
    RivenType = require('./api/models/rivenTypeModel.js'),
    RivenCondition = require('./api/models/rivenConditionModel.js'),
    Riven = require('./api/models/rivenModel.js'),
    BoosterType = require('./api/models/boosterTypeModel.js'),
    RewardType = require('./api/models/rewardTypeModel.js'),
    SortieReward = require('./api/models/sortieRewardModel.js'),
    bodyParser = require('body-parser');
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/WarframeStatsDB', { useNewUrlParser: true });

// API ROUTES
const rivenTypes = require('./routes/rivenTypeRoutes');
app.use('/riven/type', rivenTypes);
const rivenConditions = require('./routes/rivenConditionRoutes');
app.use('/riven/condition', rivenConditions);
const rivens = require('./routes/rivenRoutes');
app.use('/riven', rivens);
const boosterType = require('./routes/boosterTypeRoutes');
app.use('/booster/type', boosterType);
const rewardType = require('./routes/rewardTypeRoutes');
app.use('/reward/type', rewardType);
const sortieReward = require('./routes/sortieRewardRoute');
app.use('/reward', sortieReward);

// XLSX 2 JSON

const excel2json = require('node-excel-to-json');
var options = {
    convert_all_sheet: false, // If this value is false, Then one sheet will processed which name would be provided
    return_type: 'Object', // Two type of return type 'File' or 'Object'
    sheetName: 'Feuil1', // Only if convert_all_sheet=false
    check_array : false, // If this value is true, then a header with [] at the end means that the value is an array
    separator: ';' // Only if check_array=true, split the value with this separator
}
// app.post('/node-excel-to-json', function(req, res) {
//     if (req.body)
//     excel2json(
//         filename,
//         options,
//         {
//             convert_all_sheet: false,
//             return_type: 'Object',
//             'sheetName': 'Feuil1'
//         },
//         function (err, output) {
//             if (err)
//                 res.json(err);
//             else
//                 res.json(output);
//         });
// });

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

const indexRouter = require('./routes/index');
//const usersRouter = require('./routes/users');
const typesRouter = require('./routes/types');
const conditionsRouter = require('./routes/conditions');
const rivenFormRouter = require('./routes/rivenForm');

app.use('/', indexRouter);
//app.use('/users', usersRouter);
app.use('/types', typesRouter);
app.use('/conditions', conditionsRouter);
app.use('/rivenForm', rivenFormRouter);

// catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });
app.use(function(req, res) {
    res.status(404).send({url: req.originalUrl + ' not found'})
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