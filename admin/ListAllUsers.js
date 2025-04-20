'use strict'

const mongoose = require('mongoose');
const _ = require('lodash');
require('../api/models/Users');
const Users = mongoose.model('Users');

mongoose.Promise = global.Promise;
mongoose.set('debug', true);
mongoose.connect('mongodb://localhost/WarframeStatsDB', {family:4})

function listAllUsers(onFinish) {
    console.log('List of Users');
    Users.find().then((users) => {
        if (_.isNil(users)) console.log("Found no users. "+users)
        else {
            console.log("Found "+users.length+" users.");
            console.log(JSON.stringify(users, null, 2));
        }
        onFinish();
    });
}

listAllUsers(() => mongoose.disconnect());
