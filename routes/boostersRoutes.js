const express = require('express');
const router = express.Router();

const BoosterTypeProcess = require('../api/business/boosterTypeProcess');

/* GET home page. */
router.get('/', function(_req, res) {
    BoosterTypeProcess.list()
        .then(ret => res.render('boosters', { title: 'Booster Types', boosters: ret }));
});

module.exports = router;
