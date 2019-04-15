'use strict'

const mongoose = require('mongoose'),
    rivenType = require('./rivenTypeProcess'),
    Riven = mongoose.model('Riven');

const form2riven = function(formRiven, onOk, onError) {
    console.log(formRiven);
    const riven = new Riven();
    if (formRiven.weaponName)
        riven.weaponName = formRiven.weaponName;
    riven.conditions = formRiven.conditions.filter(function(cond) {
        return cond != 'none';
    });
    if (formRiven.N)
        riven.N = formRiven.N;
    rivenType.findByIdOrName(
        formRiven.type,
        ret => {
            riven.type = ret._id;
            console.log(riven);
            onOk(riven);
        },
        err => onError(err));
}

exports.form2riven = form2riven;