'use strict';

const express = require('express');
const router = express.Router();

const sortieReward = require('../api/business/sortieRewardProcess');

router.get('/', function (req, res) {
    sortieReward.list(
        ret => res.json(ret),
        err => res.status(500).send("Cannot list rewards from DB, "+err));
});

router.post('/add', function(req, res) {
    sortieReward.add(req.body,
        ret => res.json(ret),
        err => res.status(400).send('Invalid body, '+err));
});

router.get('/:id', function (req, res) {
    sortieReward.byId(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.send(ret);
        },
        err => res.status(500).send(err));
});

router.delete('/deleteall', function(req, res) {
    sortieReward.deleteAll(
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete all rewards in DB, "+err));
});

module.exports = router;