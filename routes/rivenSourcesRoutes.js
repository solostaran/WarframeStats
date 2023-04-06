const express = require('express');
const router = express.Router();

const RivenSourceProcess = require('../api/business/rivenSourceProcess');

/* GET home page. */
router.get('/', function(_req, res) {
    RivenSourceProcess.list()
        .then(ret => res.render('rivenSources', { title: 'Riven Sources', sources: ret }));
});

module.exports = router;
