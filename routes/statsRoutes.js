'use strict';

const express = require('express');
const router = express.Router();

const StatsProcess = require('../api/business/statsProcess');

// per netracell and temporal reward source : title and where to find it in the official droptables (search text, anchor)
const netracellPresentation = {
  'Netracell': { title: 'Statistics for Netracell mission rewards', droptable: 'Entrati Netracell Coffer', anchor: 'deeparchimedeasilverrewards' },
  'Deep Archimedea': { title: 'Statistics for Deep Archimedea rewards', droptable: 'Deep Archimedea', anchor: 'deeparchimedeasilverrewards' },
  'Temporal Archimedea': { title: 'Statistics for Temporal Archimedea rewards', droptable: 'Temporal Archimedea', anchor: 'temporalarchimedeasilverrewards' }
};

router.get('/', async function(_req, res) {
  const statsSortie = await StatsProcess.reward_stats();
  const statsNetracell = (await StatsProcess.netracell_stats()).concat(await StatsProcess.temporal_stats());
  res.render('statsGeneral', {
    'sortie':{
      title:'Riven statistics for Sortie and Archon\'s Hunt rewards',
      stats: statsSortie.listStats,
      totalCount: statsSortie.totalCount
    },
    'netracells': statsNetracell.map(s => ({
      source: s.source,
      title: netracellPresentation[s.source].title,
      droptable: netracellPresentation[s.source].droptable,
      anchor: netracellPresentation[s.source].anchor,
      stats: s.listStats,
      totalCount: s.totalCount,
      runCount: s.runCount
    }))
  });
    // StatsProcess.reward_stats()
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

module.exports = router;
