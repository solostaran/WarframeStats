'use strict';

const express = require('express');
const router = express.Router();

const rivenCondition = require('../api/business/rivenConditionProcess');

router.get('/', function (req, res) {
    rivenCondition.list(
        ret => res.json(ret),
        err => res.status(500).send("Cannot list riven conditions from DB, "+err));
});

router.get('/formatted', function(req, res) {
    rivenCondition.formattedList(
        ret => res.json(ret),
        err => res.status(500).send("Cannot list riven conditions from DB, "+err));
});

router.post('/add', function(req, res) {
    rivenCondition.add(req.body,
        ret => res.json(ret),
        err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', function(req, res) {
    rivenCondition.adds(req.body,
        ret => res.json({ "insertedCount": ret.insertedCount}),
        err => res.status(400).send('Invalid body, '+err));
});

router.get('/:id', function (req, res) {
    rivenCondition.byId(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.send(ret);
        },
        err => res.status(500).send(err));
});

router.delete('/delete/:id', function(req, res) {
    rivenCondition.deleteOneById(req.params.id,
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete, "+err));
});

router.delete('/deleteall', function(req, res) {
    rivenCondition.deleteAll(
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete all riven conditions in DB, " + err));
});

module.exports = router;