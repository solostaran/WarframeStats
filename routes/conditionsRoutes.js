const express = require('express');
const router = express.Router();

const auth = require('../config/jwt_auth').auth;
const RivenConditionProcess = require('../api/business/rivenConditionProcess');

/* GET home page. */
router.get('/', auth.optional, function(_req, res) {
    RivenConditionProcess.list()
        .then(ret => res.render('conditions', { title: 'Riven Conditions', conditions: ret }));
});

router.get('/form', auth.required, function(_req, res) {
   res.render('conditionDetails', {title:'Create riven condition'});
});

router.get('/form/:id', auth.required, function(req, res) {
    RivenConditionProcess.byId(req.params.id)
        .then(ret => res.render('conditionDetails', { title: 'Update Riven Condition', condition: ret }))
        .catch(_err => res.status(404).send(new Error('Condition not found.')));
});

module.exports = router;
