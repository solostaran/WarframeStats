'use strict';

const express = require('express');
const router = express.Router();

const StatsProcess = require('../api/business/statsProcess');

router.get('/', function(req, res) {
    StatsProcess.global(ret => res.render('statsGeneral', { title: 'General Stats', stats: ret.listStats, totalCount: ret.totalCount}));
});

router.get('/riven', function (req, res) {
    StatsProcess.riven()
        .then(ret => res.render('statsRiven', {title: 'Riven Stats', rivenStats: ret}))
        .catch(err => res.status(500).send(err));
});

router.get('/booster', function (req, res) {
    StatsProcess.booster()
        .then(ret => res.render('statsBooster', {title: 'Booster Stats', boosterStats: ret}))
        .catch(err => res.status(500).send(err));
});

module.exports = router;