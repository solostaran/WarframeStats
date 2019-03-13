'use strict'

const express = require('express');
const router = express.Router();

const rivenType = require('../api/business/rivenTypeProcess');
const rivenCondition = require('../api/business/rivenConditionProcess');

router.get('/', function(req, res, next) {
    rivenType.list(
        types => {
            rivenCondition.formattedList(
                conditions => res.render('rivenForm', { title: 'Riven Form', types: types, conditions: conditions }))
        }
    );
});

module.exports = router;