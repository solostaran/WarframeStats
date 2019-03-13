'use strict';

const express = require('express');
const router = express.Router();

const riven = require('../api/business/rivenProcess');
const rivenAdapter = require('../api/business/rivenAdapter');

router.get('/', function (req, res) {
    riven.list(
        ret => res.json(ret),
        err => res.status(500).send("Cannot list rivens from DB, "+err));
});

router.post('/add', function(req, res) {
    // riven.add(req.body,
    //     ret => res.json(ret),
    //     err => res.status(400).send('Invalid body, '+err));
    rivenAdapter.form2riven(
        req.body,
        ret => riven.add(ret,
            ret2 => riven.byId(
                ret2._id,
                riv => res.json(riv)),
            err => res.status(400).send('Invalid body, '+err)),
        err => res.status(400).send('Invalid body, '+err));
});

router.post('/formAdd', function(req, res) {
    rivenAdapter.form2riven(
        req.body,
        ret => riven.add(ret,
            ret2 => riven.byId(
                ret2._id,
                riv => res.render('rivenDetails', { riven: riv })),
            err => res.status(400).send('Invalid body, '+err)),
        err => res.status(400).send('Invalid body, '+err));
});

router.get('/:id', function (req, res) {
    riven.byId(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.send(ret);
        },
        err => res.status(500).send(err));
});

router.delete('/delete/:id', function(req, res) {
    riven.deleteOneById(req.params.id,
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete, "+err));
});

router.delete('/deleteall', function(req, res) {
    riven.deleteAll(
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete all rivens in DB, "+err));
});

module.exports = router;