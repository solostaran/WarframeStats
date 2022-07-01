'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RewardTypeProcess = require('../api/business/rewardTypeProcess.js'),
    BoosterTypeProcess = require('../api/business/boosterTypeProcess.js'),
    RivenTypeProcess = require('../api/business/rivenTypeProcess.js'),
    RivenConditionProcess = require('../api/business/rivenConditionProcess.js'),
    SortieRewardProcess = require('../api/business/sortieRewardProcess.js'),
    convertDates = require('../api/utils/convertDates');

var rewardTypes = [];
var boosterTypes =[];
var boosters = {};
async function initialize() {
    rewardTypes = await RewardTypeProcess.list();
    boosterTypes = await BoosterTypeProcess.list();
    boosters = await BoosterTypeProcess.to_array();
}
initialize();

router.get('/', auth.required, function(req, res) {
    // Promise version ... at least better than chain version
    Promise.all([
            RivenTypeProcess.list(),
            RivenConditionProcess.formattedList()
        ]).then(results => {
            let param = {
                title: 'Reward Form',
                types: rewardTypes,
                boosters: boosterTypes,
                rivens: results[0],
                conditions: results[1] };
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

async function provideRewardList(req, res) {
    let offset = req.body.offset ? Number(req.body.offset) : 0;
    let nb = req.body.nb ? Number(req.body.nb) : 20;
    //const rewardTypes = await RewardTypeProcess.list();
    //const boosterTypes = await BoosterTypeProcess.to_array();
    SortieRewardProcess.list(
        {skip: offset, limit: nb, dateLow: req.body.dateLow, dateHigh: req.body.dateHigh, type: req.body.type},
        result => {
            //console.log("Just get "+result.data.length+" rewards over "+result.count);
            res.status(200).render('rewardList', {
                date2string: convertDates.date2string,
                rewards: result.data,
                offset: offset,
                nb: nb,
                dateLow: req.body.dateLow,
                dateHigh: req.body.dateHigh,
                hasNext: offset + nb < result.count,
                totalCount: result.count,
                //boosterTypes: boosters,
                rewardTypes: rewardTypes,
                rewardTypeSelected: req.body.type
            });
        },
        err => res.status(500).send(err));
}


router.post('/list', auth.optional, function(req, res) {
    provideRewardList(req, res);
});

router.get('/list', auth.optional, function(req, res) {
    provideRewardList(req, res);
});

router.get('/list2', auth.optional, function(req, res) {
    res.render('rewardList2');
});

router.get('/:id', auth.required, function(req, res) {
    SortieRewardProcess.findById(req.params.id,
        reward => {
        if (!reward)
            res.status(404).send(null);
        else
            Promise.all([
                RivenTypeProcess.list(),
                RivenConditionProcess.formattedList()
            ]).then(results => {
                let param = {
                    title: 'Reward Update',
                    reward: reward,
                    date2string: convertDates.date2string,
                    types: rewardTypes,
                    boosters: boosterTypes,
                    rivens: results[0],
                    conditions: results[1] };
                res.render('rewardUpdate', param);
            }).catch(err => res.status(500).send(err));
        },
        err => res.status(500).send(err)
    );
});



module.exports = router;
