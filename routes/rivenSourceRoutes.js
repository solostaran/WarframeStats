'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RivenOriginProcess = require('../api/business/rivenSourceProcess');

router.get('/', auth.optional, function (req, res) {
    RivenOriginProcess.list()
        .then(ret => res.json(ret))
        .catch(err => res.status(500).send("Cannot list riven origins from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
    const { payload: { id } } = req;
    RivenOriginProcess.addOrUpdate(req.body, id)
        .then(ret => res.json(ret))
        .catch(err => res.status(400).send('Invalid body, '+err));
});

router.post('/adds', auth.required, function(req, res) {
    const { payload: { id } } = req;
    RivenOriginProcess.adds(req.body)
      .then(ret => res.json({ "insertedCount": ret.insertedCount}))
      .catch(err => res.status(400).send('Invalid body, '+err));
});

router.get('/:id', auth.optional, function (req, res) {
    RivenOriginProcess.findById(req.params.id)
        .then(ro => {
            if (ro !== null)
                res.json(ro);
            else
                res.status(404).send('Cannot find riven origin : '+req.params.id);
        })
        .catch(err => res.status(500).send(err));
});

router.delete('/delete/:id', auth.required, function(req, res) {
    RivenOriginProcess.deleteOneById(req.params.id)
        .then(ret => res.status(200).send(ret))
        .catch(err => res.status(400).send("Cannot delete, "+err));
});

router.delete('/deleteall', auth.required, function(req, res) {
    RivenOriginProcess.deleteAll()
        .then(ret => res.send(ret))
        .catch(err => res.status(500).send("Cannot delete all riven origins in DB, " + err));
});

module.exports = router;
