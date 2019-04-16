const express = require('express');
const router = express.Router();

const rivenType = require('../api/business/rivenTypeProcess');

/* GET home page. */
router.get('/', function(req, res) {
    rivenType.list(
        ret => res.render('types', { title: 'Riven Types', types: ret }));
});

module.exports = router;