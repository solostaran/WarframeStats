'use strict'

const express = require('express');
const app = express();

const mongoose = require('mongoose'),
	BoosterType = require('#root/api/models/boosterTypeModel.js'),
	RivenType = require('#root/api/models/rivenTypeModel.js'),
	RivenSource = require('#root/api/models/rivenSourceModel.js'),
	RivenCondition = require('#root/api/models/rivenConditionModel.js'),
	Riven = require('#root/api/models/rivenModel.js'),
	RewardType = require('#root/api/models/rewardTypeModel.js'),
	RewardSource = require('#root/api/models/rewardSourceModel.js'),
	Reward = require('#root/api/models/rewardModel.js'),
	sortieReward = require('#root/api/business/rewardProcess.js'),
	convertDates = require('#root/api/utils/convertDates.js'),
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
