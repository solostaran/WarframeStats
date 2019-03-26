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
    rewardType.list(
        rewardTypes => {
            boosterType.list(
                boosters => {
                    rivenType.list(
                        rivenTypes => {
                            rivenCondition.formattedList(
                                rivenConditions => {
                                    let param = {
                                        title: 'Reward Form',
                                        types: rewardTypes,
                                        boosters: boosters,
                                        rivens: rivenTypes,
                                        conditions: rivenConditions };
                                    res.render('rewardForm', param);
                                }
                            );
                        }
                    );
                }
            );
        }
    );
});

function provideRewardList(req, res) {
    let offset = req.body.offset ? Number(req.body.offset) : 0;
    let nb = req.body.nb ? Number(req.body.nb) : 20;
    sortieReward.count(count =>
    sortieReward.list({skip: offset, limit: nb},
        list => {
            res.render('rewardList', {
                date2string: convertDates.date2string,
                rewards: list,
                offset: offset,
                nb: nb,
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
            rewardType.list(
                rewardTypes => {
                    boosterType.list(
                        boosters => {
                            rivenType.list(
                                rivenTypes => {
                                    rivenCondition.formattedList(
                                        rivenConditions => {
                                            let param = {
                                                title: 'Reward Update',
                                                reward: reward,
                                                date2string: convertDates.date2string,
                                                types: rewardTypes,
                                                boosters: boosters,
                                                rivens: rivenTypes,
                                                conditions: rivenConditions
                                            };
                                            res.render('rewardUpdate', param);
                                        }
                                    );
                                }
                            );
                        }
                    );
                }
            );
        },
        err => res.status(500).send(err)
    );
});



module.exports = router;