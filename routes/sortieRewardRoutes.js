'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const SortieRewardProcess = require('../api/business/sortieRewardProcess');
const convertDates = require('../api/utils/convertDates');

router.get('/', auth.optional, function (req, res) {
    SortieRewardProcess.list({},
        ret => res.json(ret),
        err => res.status(500).send("Cannot list rewards from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
    const { payload: { id } } = req;
    SortieRewardProcess.addOrUpdate(req.body, id)
        .then(ret => res.json(ret))
        .catch(err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', auth.required, function(req, res) {
    const { payload: { id } } = req;
    SortieRewardProcess.adds(req.body, id,
        ret => res.json(ret),
        err => res.status(400).send('Invalid body, '+err));
});

router.post('/form', auth.required, function(req, res) {
    const { payload: { id } } = req;
    SortieRewardProcess.addOrUpdate(req.body, id)
        .then(ret => SortieRewardProcess.findById(
            ret._id,
            reward => res.render('rewardDetails',
                {
                    title: 'Reward Details',
                    date2string: convertDates.date2string,
                    reward: reward
                }),
            err => res.status(400).send(err)
        ))
        .catch(err => res.status(400).send(err));
});

router.get('/:id', auth.optional, function (req, res) {
    SortieRewardProcess.findById(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else {
                res.send(ret);
            }
        },
        err => res.status(500).send(err));
});

router.get('/view/:id', auth.optional, function(req, res) {
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

router.delete('/delete/:id', auth.required, function(req, res) {
    SortieRewardProcess.deleteOneById(req.params.id)
        .then(ret => res.status(200).send(ret))
        .catch(err => res.status(400).send("Cannot delete : "+err));
});

router.delete('/deleteall', auth.required, function(req, res) {
    SortieRewardProcess.deleteAll()
        .then(ret => res.status(200).send(ret))
        .catch(err => res.status(500).send("Cannot delete all rewards in DB, "+err));
});

module.exports = router;