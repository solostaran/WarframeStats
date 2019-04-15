'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RivenTypeProcess = require('../api/business/rivenTypeProcess');

router.get('/', auth.optional, function (req, res) {
    RivenTypeProcess.list(
        ret => res.json(ret),
        err => res.status(500).send("Cannot list riven types from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
    RivenTypeProcess.add(req.body,
        ret => res.json(ret),
        err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', auth.required, function(req, res) {
    RivenTypeProcess.adds(req.body,
        ret => res.json({ "insertedCount": ret.insertedCount}),
        err => res.status(400).send('Invalid body, '+err));
});

router.get('/:id', auth.optional, function (req, res) {
    RivenTypeProcess.findById(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.send(ret);
        },
        err => res.status(500).send(err));
});

router.delete('/delete/:id', auth.required, function(req, res) {
    RivenTypeProcess.deleteOneById(req.params.id,
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete, "+err));
});

router.delete('/deleteall', auth.required, function(req, res) {
    RivenTypeProcess.deleteAll(
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete all riven types in DB, "+err));
});

module.exports = router;