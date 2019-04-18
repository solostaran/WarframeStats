'use strict'

const mongoose = require('mongoose');
const _ = require('lodash');
require('../api/models/Users');
const Users = mongoose.model('Users');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/WarframeStatsDB', { useNewUrlParser: true });
mongoose.set('debug', true);

function deleteAllUsers(onFinish) {
    console.log('Delete all Users');
    Users.deleteMany({}, ret => {
        console.log(JSON.stringify(ret));
        onFinish();
    });
}

deleteAllUsers(() => mongoose.disconnect(() => process.exit(0)));