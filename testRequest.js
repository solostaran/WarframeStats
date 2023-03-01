'use strict'

const express = require('express');
const app = express();

const mongoose = require('mongoose'),
	BoosterType = require('./api/models/boosterTypeModel'),
	RivenType = require('./api/models/rivenTypeModel'),
	RivenSource = require('./api/models/rivenSourceModel'),
	RivenCondition = require('./api/models/rivenConditionModel'),
	Riven = require('./api/models/rivenModel'),
	RewardType = require('./api/models/rewardTypeModel'),
	RewardSource = require('./api/models/rewardSourceModel'),
	Reward = require('./api/models/rewardModel'),
	sortieReward = require('./api/business/rewardProcess'),
	convertDates = require('./api/utils/convertDates'),
	bodyParser = require('body-parser'),
	logger = require('morgan');

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: true
}));
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://127.0.0.1/WarframeStatsDB', { useUnifiedTopology: true, useNewUrlParser: true });

function testRequest() {
	console.log("Get all rewards");
	sortieReward.list({skip: 20, limit: 20},
		list => {
			console.log('list size='+list.count);
			mongoose.disconnect();
		},
		err => {
			console.log(err);
			mongoose.disconnect();
		}
	);
}

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

testRequest();
