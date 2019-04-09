'use strict';

const express = require('express');
const router = express.Router();

const RewardTypeRoutes = require('../api/business/rewardTypeProcess');

router.get('/', function (req, res) {
    RewardTypeRoutes.list(
        ret => res.json(ret),
        err => res.status(500).send("Cannot list reward types from DB, "+err));
});

router.post('/add', function(req, res) {
    RewardTypeRoutes.add(req.body,
        ret => res.json(ret),
        err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', function(req, res) {
    RewardTypeRoutes.adds(req.body,
        ret => res.json({ "insertedCount": ret.insertedCount}),
        err => res.status(400).send('Invalid body, '+err));
});

router.get('/:id', function (req, res) {
    RewardTypeRoutes.findById(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.send(ret);
        },
        err => res.status(500).send(err));
});

router.delete('/delete/:id', function(req, res) {
    RewardTypeRoutes.deleteOneById(req.params.id,
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete, "+err));
});

router.delete('/deleteall', function(req, res) {
    RewardTypeRoutes.deleteAll(
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete all reward types in DB, "+err));
});

module.exports = router;