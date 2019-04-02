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

router.post('/form', function(req, res) {
    // sortieReward.addOrUpdate(req.body,
    //     ret => sortieReward.findById(
    //         ret._id,
    //         reward => res.render('rewardDetails',
    //             {
    //                 title: 'Reward Details',
    //                 date2string: convertDates.date2string,
    //                 reward: reward
    //             }),
    //         err => res.status(400).send(err)
    //     ),
    //     err => res.status(400).send(err));
    console.log(req.body);
    rivenCondition.addOrUpdate(req.body,
        () => rivenCondition.list(list => res.render('conditions', { title: 'Riven Conditions', conditions: list })),
        err => res.status(500).send(err)
    );
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