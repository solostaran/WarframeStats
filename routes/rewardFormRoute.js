'use strict'

const express = require('express');
const router = express.Router();

const rewardType = require('../api/business/rewardTypeProcess.js'),
    boosterType = require('../api/business/boosterTypeProcess.js'),
    rivenType = require('../api/business/rivenTypeProcess.js'),
    rivenCondition = require('../api/business/rivenConditionProcess.js'),
    sortieReward = require('../api/business/sortieRewardProcess.js');

function date2string(date) {
    const split = date.split(/\D/);
    return split[0]+'/'+split[1]+'/'+split[2];
}

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

router.get('/list', function(req, res, next) {
    sortieReward.list(
        list => res.render('rewardList', {
            date2string: (d) => {
                const split = d.toISOString().split(/\D/);
                return split[0]+'/'+split[1]+'/'+split[2];
            },
            rewards: list
        }),
        err => res.status(500).send(err)
    )
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
                                                date2string: (d) => {
                                                    const split = d.toISOString().split(/\D/);
                                                    return split[0]+'/'+split[1]+'/'+split[2];
                                                },
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