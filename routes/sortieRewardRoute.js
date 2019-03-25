'use strict';

const express = require('express');
const router = express.Router();

const sortieReward = require('../api/business/sortieRewardProcess');
const rewardAdapter = require('../api/business/rewardAdapter');

router.get('/', function (req, res) {
    sortieReward.list(
        ret => res.json(ret),
        err => res.status(500).send("Cannot list rewards from DB, "+err));
});

router.post('/add', function(req, res) {
    sortieReward.addOrUpdate(req.body,
        ret => res.json(ret),
        err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', function(req, res) {
    sortieReward.adds(req.body,
        ret => res.json(ret),
        err => res.status(400).send('Invalid body, '+err));
});

// function date2string(date) {
//     const split = date.split(/\D/);
//     return split[0]+'/'+split[1]+'/'+split[2];
// }

router.post('/form', function(req, res) {
    sortieReward.addOrUpdate(req.body,
        ret => sortieReward.findById(
            ret._id,
            reward => res.render('rewardDetails',
                {
                    title: 'Reward Details',
                    date2string: (d) => {
                        const split = d.toISOString().split(/\D/);
                        return split[0]+'/'+split[1]+'/'+split[2];
                    },
                    reward: reward
                }),
            err => res.status(400).send(err)
        ),
        err => res.status(400).send(err));
});

router.get('/:id', function (req, res) {
    sortieReward.findById(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.send(ret);
        },
        err => res.status(500).send(err));
});

router.get('/view/:id', function(req, res) {
    sortieReward.findById(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.render('rewardDetails', {
                    date2string: (d) => {
                        const split = d.toISOString().split(/\D/);
                        return split[0]+'/'+split[1]+'/'+split[2];
                    },
                    reward: ret
                });
        },
        err => res.status(500).send(err));
});

router.delete('/delete/:id', function(req, res) {
    sortieReward.deleteOneById(req.params.id,
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete, "+err));
});

router.delete('/deleteall', function(req, res) {
    sortieReward.deleteAll(
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete all rewards in DB, "+err));
});

module.exports = router;