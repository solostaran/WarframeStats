const express = require('express');
const router = express.Router();

const BoosterTypeProcess = require('../api/business/boosterTypeProcess');

/* GET home page. */
router.get('/', function(req, res, next) {
    BoosterTypeProcess.list(
        ret => res.render('boosters', { title: 'Booster Types', boosters: ret })
    );
});

module.exports = router;