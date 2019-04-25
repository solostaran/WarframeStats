'use strict'

const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RivenTypeProcess = require('../api/business/rivenTypeProcess');
const RivenConditionProcess = require('../api/business/rivenConditionProcess');

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

module.exports = router;