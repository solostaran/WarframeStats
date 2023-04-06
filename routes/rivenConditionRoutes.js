'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RivenConditionProcess = require('../api/business/rivenConditionProcess');

router.get('/', auth.optional, function (_req, res) {
    RivenConditionProcess.list()
        .then(ret => res.json(ret))
        .catch(err => res.status(500).send("Cannot list riven conditions from DB, "+err));
});

router.get('/formatted', auth.optional, function(_req, res) {
    RivenConditionProcess.formattedList()
        .then(ret => res.json(ret))
        .catch(err => res.status(500).send("Cannot list riven conditions from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
    const { auth: { id } } = req;
    RivenConditionProcess.addOrUpdate(req.body, id)
        .then(ret => res.json(ret))
        .catch(err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', auth.required, function(req, res) {
    const { auth: { id } } = req;
    RivenConditionProcess.adds(req.body, id)
      .then(ret => res.json(ret))
      .catch(err => res.status(400).send('Invalid body, '+err));
});

router.post('/form', auth.required, function(req, res) {
    const { auth: { id } } = req;
    RivenConditionProcess.addOrUpdate(req.body, id)
        .then(() => RivenConditionProcess.list().then(list => res.render('conditions', { title: 'Riven Conditions', conditions: list })))
        .catch(err => res.status(500).send(err));
});

router.get('/:id', auth.optional, function (req, res) {
    RivenConditionProcess.byId(req.params.id)
        .then(rcond => {
            if (rcond !== null)
                res.json(rcond);
            else
                res.status(404).send('Cannot find riven condition : '+req.params.id);
        })
        .catch(err => res.status(500).send(err));
});

router.delete('/delete/:id', auth.required, function(req, res) {
    RivenConditionProcess.deleteOneById(req.params.id)
        .then(ret => res.status(200).send(ret))
        .catch(err => res.status(400).send("Cannot delete, "+err));
});

router.delete('/deleteall', auth.required, function(req, res) {
    const { auth: { id } } = req;
    console.log("Delete all Riven Conditions by User : "+id);
    RivenConditionProcess.deleteAll()
        .then(ret => res.send(ret))
        .catch(err => res.status(500).send("Cannot delete all riven conditions in DB, " + err));
});

module.exports = router;
