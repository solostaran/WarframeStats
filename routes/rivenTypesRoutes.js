const express = require('express');
const router = express.Router();

const RivenTypeProcess = require('../api/business/rivenTypeProcess');

/* GET home page. */
router.get('/', function(_req, res) {
    RivenTypeProcess.list()
        .then(ret => res.render('rivenTypes', { title: 'Riven Types', types: ret }));
});

module.exports = router;
