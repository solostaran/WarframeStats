const express = require('express');
const router = express.Router();

const RivenTypeProcess = require('#root/api/domain/rivenTypeProcess.js');

/* GET home page. */
router.get('/', function(_req, res) {
    RivenTypeProcess.list()
        .then(ret => res.render('rivenTypes', { title: 'Riven Types', types: ret }));
});

module.exports = router;
