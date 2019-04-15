'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RivenConditionProcess = require('../api/business/rivenConditionProcess');

router.get('/', auth.optional, function (req, res) {
    RivenConditionProcess.list(
        ret => res.json(ret),
        err => res.status(500).send("Cannot list riven conditions from DB, "+err));
});

router.get('/formatted', auth.optional, function(req, res) {
    RivenConditionProcess.formattedList(
        ret => res.json(ret),
        err => res.status(500).send("Cannot list riven conditions from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
    RivenConditionProcess.add(req.body,
        ret => res.json(ret),
        err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', auth.required, function(req, res) {
    RivenConditionProcess.adds(req.body,
        ret => res.json({ "insertedCount": ret.insertedCount}),
        err => res.status(400).send('Invalid body, '+err));
});

router.post('/form', auth.required, function(req, res) {
    RivenConditionProcess.addOrUpdate(req.body,
        () => RivenConditionProcess.list(list => res.render('conditions', { title: 'Riven Conditions', conditions: list })),
        err => res.status(500).send(err)
    );
});

router.get('/:id', auth.optional, function (req, res) {
    RivenConditionProcess.byId(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.send(ret);
        },
        err => res.status(500).send(err));
});

router.delete('/delete/:id', auth.required, function(req, res) {
    RivenConditionProcess.deleteOneById(req.params.id,
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete, "+err));
});

router.delete('/deleteall', auth.required, function(req, res) {
    RivenConditionProcess.deleteAll(
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete all riven conditions in DB, " + err));
});

module.exports = router;