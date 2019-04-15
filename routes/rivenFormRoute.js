'use strict'

const express = require('express');
const router = express.Router();

const RivenTypeProcess = require('../api/business/rivenTypeProcess');
const RivenConditionProcess = require('../api/business/rivenConditionProcess');

router.get('/', async function (req, res, next) {
    try {
        const rivenTypes = await new Promise(RivenTypeProcess.list);
        const rivenConditions = await new Promise(RivenConditionProcess.formattedList);
        res.render('rivenForm', {title: 'Riven Form', types: rivenTypes, conditions: rivenConditions});
    } catch (err) {
        res.render('error', {err: err});
    }
});

module.exports = router;