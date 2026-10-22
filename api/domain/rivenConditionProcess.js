'use strict';

const mongoose = require('mongoose');
const RivenCondition = mongoose.model('RivenCondition');

const list = function() {
    return RivenCondition.find({}).sort({optional: 1}).exec();
};

const formattedList = async function() {
    return {
        mandatories: await RivenCondition.find({ optional: { $not: {$exists:true}}}).exec(),
        optionals: await RivenCondition.find({ optional: {$exists:true}}).exec()
    };
};

const addOrUpdate = async function(obj, userId) {
    let cond;
    if (obj === null) return Promise.reject('Null object');
    if (obj._id) {
        // update existing condition
        cond = await RivenCondition.findById(obj._id);
        cond.modifiedBy = userId;
        cond.markModified('modifiedBy');
    } else {
        // create a new condition
        cond = new RivenCondition(obj);
        cond.createdBy = userId;
        cond.markModified('createdBy');
    }
    cond.description = obj.description;
    cond.markModified('description');
    if (obj.optional && (obj.optional === 'on' || obj.optional === 'true'))
        cond.optional = true;
    else
        cond.optional = undefined;
    cond.markModified('optional');
    cond.advices = obj.advices;
    cond.markModified('advices');
    return cond.save();
};

// Insert one by one with transformations instead of insertMany(...,{ ordered: true, rawResult: true })
const adds = function(listOfConditions, userId) {
    let inserted = 0;
    let rejected = 0;
    let rejects = [];
    Promise.all(
        listOfConditions.map(rcond => new Promise(
            resolve => addOrUpdate(rcond, userId)
                .then(ret => { ++inserted; resolve(ret)})
                .catch(err => {
                    rejects.push({ reject: rcond, error: err.message});
                    ++rejected;
                    resolve(err);
                }))
        )
    ).then(() => {
        const result = {insertedCount: inserted , rejectedCount: rejected, rejects: rejects };
        //console.log("Conditions insertion : "+JSON.stringify(result));
        return Promise.resolve(result);
    }).catch(err => { return Promise.reject(err); });
};

const byId = function(id) {
    return RivenCondition.findById(id).exec();
};

const deleteOneById = function(id) {
    return RivenCondition
        .deleteOne({"_id":id})
        .exec();
};

const deleteAll = function() {
    return RivenCondition
        .deleteMany({})
        .exec();
};

exports.list = list;
exports.formattedList = formattedList;
exports.addOrUpdate = addOrUpdate;
exports.adds = adds;
exports.byId = byId;
exports.deleteOneById = deleteOneById;
exports.deleteAll = deleteAll;
