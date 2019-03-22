const express = require('express');
const router = express.Router();

const boosterType = require('../api/business/boosterTypeProcess');

/* GET home page. */
router.get('/', function(req, res, next) {
    boosterType.list(
        ret => res.render('boosters', { title: 'Booster Types', boosters: ret })
    );
});

module.exports = router;