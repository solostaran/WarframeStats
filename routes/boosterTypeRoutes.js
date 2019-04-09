'use strict';

const express = require('express');
const router = express.Router();

const BoosterTypeProcess = require('../api/business/boosterTypeProcess');

router.get('/', function (req, res) {
    BoosterTypeProcess.list(
        ret => res.json(ret),
        err => res.status(500).send("Cannot list booster types from DB, "+err));
});

router.post('/add', function(req, res) {
    BoosterTypeProcess.add(req.body,
        ret => res.json(ret),
        err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', function(req, res) {
    BoosterTypeProcess.adds(req.body,
        ret => res.json({ "insertedCount": ret.insertedCount}),
        err => res.status(400).send('Invalid body, '+err));
});

router.get('/:id', function (req, res) {
    BoosterTypeProcess.findById(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.send(ret);
        },
        err => res.status(500).send(err));
});

router.delete('/delete/:id', function(req, res) {
    BoosterTypeProcess.deleteOneById(req.params.id,
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete, "+err));
});

router.delete('/deleteall', function(req, res) {
    BoosterTypeProcess.deleteAll(
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete all booster types in DB, "+err));
});

module.exports = router;