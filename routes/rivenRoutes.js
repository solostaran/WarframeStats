'use strict';

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RivenProcess = require('../api/business/rivenProcess');
const obfuscate = require('../api/utils/obfuscate');

router.get('/', auth.optional, function (_req, res) {
    RivenProcess.list()
        .then(ret => res.json(ret))
        .catch(err => res.status(500).send("Cannot list rivens from DB, "+err));
});

router.post('/add', auth.required, function(req, res) {
    const { auth: { id } } = req;
    RivenProcess.addOrUpdate(req.body, id)
        .then(riven => {
            console.log("Add 1 riven["+riven._id+"] by User["+obfuscate.obfuscate_id(id)+"]");
            res.json(riven)
        })
        .catch(err => res.status(400).send(err));
});

router.post('/form', auth.required, function(req, res) {
    const { auth: { id } } = req;
    RivenProcess.addOrUpdate(req.body, id)
        .then(riven => {
            console.log("Add 1 riven["+riven._id+"] by User["+obfuscate.obfuscate_id(id)+"]");
            res.render('rivenDetails', { riven: riven, obfuscate_email: obfuscate.obfuscate_email })
        })
        .catch(err => res.status(400).send(err));
});

router.get('/:id', auth.optional, function (req, res) {
    RivenProcess.byId(req.params.id)
        .then(riven => res.json(riven))
        .catch (err => res.status(400).send(err));
});

router.get('/view/:id', auth.optional, function(req, res) {
    RivenProcess.byId(req.params.id)
        .then(riven => res.render('rivenDetails', {
            //date2string: convertDates.date2string,
            riven: riven,
            obfuscate_email: obfuscate.obfuscate_email
        }))
        .catch(err => res.status(400).send(err));
});

router.delete('/delete/:id', auth.required,  function(req, res) {
    const { auth: { id } } = req;
    RivenProcess.deleteOneById(req.params.id)
        .then(ret => {
          console.log("Delete riven["+ret._id+"] by User["+obfuscate.obfuscate_id(id)+"]");
          res.status(200).send(ret)
        })
        .catch(err => res.status(400).send("Cannot delete, "+err));
});

router.delete('/deleteall', auth.required, function(req, res) {
    const { auth: { id } } = req;
    console.log("Delete all Rivens by User["+obfuscate.obfuscate_id(id)+"]");
    RivenProcess.deleteAll()
        .then(ret => res.status(200).send(ret))
        .catch(err => res.status(500).send("Cannot delete all sortie rewards in DB, "+err));
});

module.exports = router;
