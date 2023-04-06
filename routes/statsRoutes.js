'use strict';

const express = require('express');
const router = express.Router();

const StatsProcess = require('../api/business/statsProcess');

router.get('/', function(_req, res) {
    StatsProcess.all_stats()
      .then(ret => res.render('statsGeneral', { title: 'General statistics for Sortie and Archon\'s Hunt rewards', stats: ret.listStats, totalCount: ret.totalCount}))
      .catch(err => res.status(500).send(err));
});

router.get('/riven', function (_req, res) {
    StatsProcess.riven()
        .then(ret => res.render('statsRiven', {title: 'Riven statistics for Sortie and Archon\'s Hunt rewards', rivenStats: ret}))
        .catch(err => res.status(500).send(err));
});

router.get('/booster', function (_req, res) {
    StatsProcess.booster()
        .then(ret => res.render('statsBooster', {title: 'Booster statistics for Sortie and Archon\'s Hunt rewards', boosterStats: ret}))
        .catch(err => res.status(500).send(err));
});

module.exports = router;
