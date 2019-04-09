'use strict';

const express = require('express');
const router = express.Router();

const SortieRewardProcess = require('../api/business/sortieRewardProcess');
const convertDates = require('../api/utils/convertDates');

router.get('/', function (req, res) {
    SortieRewardProcess.list({},
        ret => res.json(ret),
        err => res.status(500).send("Cannot list rewards from DB, "+err));
});

router.post('/add', function(req, res) {
    SortieRewardProcess.addOrUpdate(req.body,
        ret => res.json(ret),
        err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', function(req, res) {
    SortieRewardProcess.adds(req.body,
        ret => res.json(ret),
        err => res.status(400).send('Invalid body, '+err));
});

router.post('/form', function(req, res) {
    SortieRewardProcess.addOrUpdate(req.body,
        ret => SortieRewardProcess.findById(
            ret._id,
            reward => res.render('rewardDetails',
                {
                    title: 'Reward Details',
                    date2string: convertDates.date2string,
                    reward: reward
                }),
            err => res.status(400).send(err)
        ),
        err => res.status(400).send(err));
});

router.get('/:id', function (req, res) {
    SortieRewardProcess.findById(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.send(ret);
        },
        err => res.status(500).send(err));
});

router.get('/view/:id', function(req, res) {
    SortieRewardProcess.findById(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.render('rewardDetails', {
                    date2string: convertDates.date2string,
                    reward: ret
                });
        },
        err => res.status(500).send(err));
});

router.delete('/delete/:id', function(req, res) {
    SortieRewardProcess.deleteOneById(req.params.id,
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete, "+err));
});

router.delete('/deleteall', function(req, res) {
    SortieRewardProcess.deleteAll(
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete all rewards in DB, "+err));
});

module.exports = router;