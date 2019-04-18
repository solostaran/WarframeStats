const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RivenConditionProcess = require('../api/business/rivenConditionProcess');

/* GET home page. */
router.get('/', auth.optional, function(req, res, next) {
    RivenConditionProcess.list(
        ret => res.render('conditions', { title: 'Riven Conditions', conditions: ret })
    );
});

router.get('/form', auth.required, function(req, res, next) {
   res.render('conditionDetails', {title:'Create riven condition'});
});

router.get('/form/:id', auth.required, function(req, res, next) {
    RivenConditionProcess.byId(req.params.id,
        ret => res.render('conditionDetails', { title: 'Update Riven Condition', condition: ret }),
        err => res.status(404).send(new Error('Condition not found.'))
    );
});

module.exports = router;