'use strict';

const mongoose = require('mongoose'),
    RivenTypeProcess = require('./rivenTypeProcess'),
    Riven = mongoose.model('Riven');

const form2riven = async function(formRiven, userId) {
    let riven;
    if (formRiven._id) {
        // update existing riven
        riven = await Riven.findById(formRiven._id).exec();
        if (riven === null) {
            return Promise.reject('A riven ID was provided but no riven found.');
        }
        riven.modifiedBy = userId;
        riven.markModified('modifiedBy');
    } else {
        // Create a new reward
        riven = new Riven(formRiven);
        riven.createdBy = userId;
        riven.markModified('createdBy');
    }
    riven.type = await RivenTypeProcess.findByIdOrName(formRiven.type);
    if (riven.type === null)
        //return new Error()
        return Promise.reject('This riven type cannot be defined : '+formRiven.type);
    riven.markModified('type');
    riven.weaponName = formRiven.weaponName;
    riven.markModified('weaponName');
    let conds = [];
    if (formRiven.conditions)
        conds = formRiven.conditions.filter(function(cond) { return cond !== 'none'; });
    riven.conditions = conds;
    riven.markModified('conditions');
    //console.log(JSON.stringify(riven));
    return riven;
};

exports.form2riven = form2riven;