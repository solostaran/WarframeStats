'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const BoosterTypeProcess = require('../api/business/boosterTypeProcess');

router.get('/', auth.optional, function (req, res) {
    BoosterTypeProcess
        .list()
        .then(ret => res.json(ret))
        .catch(err => res.status(500).send("Cannot list booster types from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
    BoosterTypeProcess
        .add(req.body)
        .then(ret => res.json(ret))
        .catch(err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', auth.required, function(req, res) {
    BoosterTypeProcess
        .adds(req.body)
        .then(ret => res.json({ "insertedCount": ret.insertedCount}))
        .catch(err => res.status(400).send('Invalid body, '+err));
});

router.get('/:id', auth.optional, function (req, res) {
    BoosterTypeProcess.findById(req.params.id)
        .then(ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.send(ret);
        })
        .catch(err => res.status(400).send(err));
});

router.delete('/delete/:id', auth.required, function(req, res) {
    BoosterTypeProcess
        .deleteOneById(req.params.id)
        .then(ret => res.status(200).send(ret))
        .catch(err => res.status(500).send("Cannot delete, "+err));
});

router.delete('/deleteall', auth.required, function(req, res) {
    BoosterTypeProcess.deleteAll()
        .then(ret => res.status(200).send(ret))
        .catch(err => res.status(500).send("Cannot delete all booster types in DB, "+err));
});

module.exports = router;