const express = require('express');
const router = express.Router();

const rivenCondition = require('../api/business/rivenConditionProcess');

/* GET home page. */
router.get('/', function(req, res, next) {
    rivenCondition.list(
        ret => res.render('conditions', { title: 'Riven Conditions', conditions: ret })
    );
});

router.get('/form', function(req, res, next) {
   res.render('conditionDetails', {title:'Create riven condition'});
});

router.get('/form/:id', function(req, res, next) {
    rivenCondition.byId(req.params.id,
        ret => res.render('conditionDetails', { title: 'Update Riven Condition', condition: ret }),
        err => res.status(404).send(new Error('Condition not found.'))
    );
});

module.exports = router;