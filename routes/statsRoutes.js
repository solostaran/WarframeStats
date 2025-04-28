'use strict';

const express = require('express');
const router = express.Router();

const StatsProcess = require('../api/business/statsProcess');

router.get('/', async function(_req, res) {
  const statsSortie = await StatsProcess.sortie_stats();
  const statsNetracell = await StatsProcess.netracell_stats();
  res.render('statsGeneral', {
    'sortie':{
      title:'Riven statistics for Sortie and Archon\'s Hunt rewards',
      stats: statsSortie.listStats,
      totalCount: statsSortie.totalCount
    },
    'netracell':{
      title:'Statistics for Netracell mission rewards',
      stats: statsNetracell.listStats,
      totalCount: statsNetracell.totalCount
    }
  });
    // StatsProcess.sortie_stats()
    //   .then(ret => res.render('statsGeneral', { titleSortie: 'General statistics for Sortie and Archon\'s Hunt rewards', stats: ret.listStats, totalCount: ret.totalCount}))
    //   .catch(err => res.status(500).send(err));
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

router.get('/netra', function(_req, res) {
   StatsProcess.netracell_stats()
     .then(ret => res.send(ret))
     .catch(err => res.status(500).send(err));
});

module.exports = router;
