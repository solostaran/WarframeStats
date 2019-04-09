'use strict';

const express = require('express');
const router = express.Router();

const RivenProcess = require('../api/business/rivenProcess');
const RivenAdapter = require('../api/business/rivenAdapter');

router.get('/', function (req, res) {
    RivenProcess.list(
        ret => res.json(ret),
        err => res.status(500).send("Cannot list rivens from DB, "+err));
});

router.post('/add', function(req, res) {
    RivenAdapter.form2riven(
        req.body,
        ret => RivenProcess.add(ret,
            ret2 => RivenProcess.byId(
                ret2._id,
                riv => res.json(riv)),
            err => res.status(400).send('Invalid body, '+err)),
        err => res.status(400).send('Invalid body, '+err));
});

router.post('/formAdd', function(req, res) {
    RivenAdapter.form2riven(
        req.body,
        ret => RivenProcess.add(ret,
            ret2 => RivenProcess.byId(
                ret2._id,
                riv => res.render('rivenDetails', { riven: riv })),
            err => res.status(400).send('Invalid body, '+err)),
        err => res.status(400).send('Invalid body, '+err));
});

router.get('/:id', function (req, res) {
    RivenProcess.byId(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.send(ret);
        },
        err => res.status(500).send(err));
});

router.get('/view/:id', function(req, res) {
    RivenProcess.byId(req.params.id,
        ret => {
            if (!ret)
                res.status(404).send(null);
            else
                res.render('rivenDetails', {
                    //date2string: convertDates.date2string,
                    riven: ret
                });
        },
        err => res.status(500).send(err));
});

router.delete('/delete/:id', function(req, res) {
    RivenProcess.deleteOneById(req.params.id,
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete, "+err));
});

router.delete('/deleteall', function(req, res) {
    RivenProcess.deleteAll(
        ret => res.status(200).send(ret),
        err => res.status(500).send("Cannot delete all sortie rewards in DB, "+err));
});

module.exports = router;