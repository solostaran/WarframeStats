'use strict'

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RivenTypeProcess = require('../api/business/rivenTypeProcess');
const RivenConditionProcess = require('../api/business/rivenConditionProcess');
const RivenProcess = require('../api/business/rivenProcess');
const convertDates = require('../api/utils/convertDates');

router.get('/', auth.required, async function (req, res, next) {
    try {
        const rivenTypes = await RivenTypeProcess.list();
        const rivenConditions = await RivenConditionProcess.formattedList();
        console.log("manda="+rivenConditions.mandatories.length+", opt="+rivenConditions.optionals.length);
        res.render('rivenForm', {title: 'Riven Form', types: rivenTypes, conditions: rivenConditions});
    } catch (err) {
        res.render('error', {err: err});
    }
});

router.get('/list', auth.optional, async function(req,res) {
    try {
        const rivens = await RivenProcess.list();
        res.render('rivenList', {
            title: 'Riven Form',
            date2string: convertDates.date2string,
            rivens: rivens});
    } catch (err) {
        res.render('error', {err: err});
    }
});

module.exports = router;