const express = require('express');
const router = express.Router();

const rivenCondition = require('../api/business/rivenConditionProcess');

/* GET home page. */
router.get('/', function(req, res, next) {
    rivenCondition.list(
        ret => res.render('conditions', { title: 'Riven Conditions', conditions: ret })
    );
});

module.exports = router;