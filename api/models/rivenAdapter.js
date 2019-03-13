'use strict'

const mongoose = require('mongoose'),
    Riven = mongoose.model('Riven');

const form2riven = function(formRiven) {
    //console.log(formRiven);
    const riven = new Riven();
    riven.type = formRiven.type;
    if (formRiven.weaponName)
        riven.weaponName = formRiven.weaponName;
    riven.conditions = formRiven.conditions.filter(function(cond) {
       return cond != 'none';
    });
    //console.log(riven);
    return riven;
}

exports.form2riven = form2riven;