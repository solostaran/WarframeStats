'use strict'

const express = require('express');
const router = express.Router();

const rewardType = require('../api/business/rewardTypeProcess.js'),
    boosterType = require('../api/business/boosterTypeProcess.js'),
    rivenType = require('../api/business/rivenTypeProcess.js'),
    rivenCondition = require('../api/business/rivenConditionProcess.js'),
    sortieReward = require('../api/business/sortieRewardProcess.js'),
    convertDates = require('../api/utils/convertDates');

router.get('/', function(req, res, next) {
    // Promise version ... at least better than chain version
    Promise.all([
            new Promise(rewardType.list),
            new Promise(boosterType.list),
            new Promise(rivenType.list),
            new Promise(rivenCondition.formattedList)
        ]).then(results => {
            let param = {
                title: 'Reward Form',
                types: results[0],
                boosters: results[1],
                rivens: results[2],
                conditions: results[3] };
            res.render('rewardForm', param);
    }).catch(err => res.status(500).send(err));

    // Query chain version ... BAD
    // rewardType.list(
    //     rewardTypes => {
    //         boosterType.list(
    //             boosters => {
    //                 rivenType.list(
    //                     rivenTypes => {
    //                         rivenCondition.formattedList(
    //                             rivenConditions => {
    //                                 let param = {
    //                                     title: 'Reward Form',
    //                                     types: rewardTypes,
    //                                     boosters: boosters,
    //                                     rivens: rivenTypes,
    //                                     conditions: rivenConditions };
    //                                 res.render('rewardForm', param);
    //                             }
    //                         );
    //                     }
    //                 );
    //             }
    //         );
    //     }
    // );
});

function provideRewardList(req, res) {
    let offset = req.body.offset ? Number(req.body.offset) : 0;
    let nb = req.body.nb ? Number(req.body.nb) : 30;
    sortieReward.count(count =>
    sortieReward.list({skip: offset, limit: nb, dateLow: req.body.dateLow, dateHigh: req.body.dateHigh },
        list => {
            res.render('rewardList', {
                date2string: convertDates.date2string,
                rewards: list,
                offset: offset,
                nb: nb,
                dateLow: req.body.dateLow,
                dateHigh: req.body.dateHigh,
                hasNext: list.length < nb ? false : true,
                totalCount: count
            });
        },
        err => res.status(500).send(err)
    ));
}


router.post('/list', function(req, res, next) {
    provideRewardList(req, res);
});

router.get('/list', function(req, res, next) {
    provideRewardList(req, res);
});

router.get('/:id', function(req, res, next) {
    sortieReward.findById(req.params.id,
        reward => {
        if (!reward)
            res.status(404).send(null);
        else
            Promise.all([
                new Promise(rewardType.list),
                new Promise(boosterType.list),
                new Promise(rivenType.list),
                new Promise(rivenCondition.formattedList)
            ]).then(results => {
                let param = {
                    title: 'Reward Update',
                    reward: reward,
                    date2string: convertDates.date2string,
                    types: results[0],
                    boosters: results[1],
                    rivens: results[2],
                    conditions: results[3] };
                res.render('rewardUpdate', param);
            }).catch(err => res.status(500).send(err));
        },
        err => res.status(500).send(err)
    );
});



module.exports = router;