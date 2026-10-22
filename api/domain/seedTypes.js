'use strict';

// inserts a document { type } in "Model" for each value of "types"
// (netracell and temporal reward types and sources : POST /.../setTypes, /.../setSources)
const seed = function(Model, types, label, onSuccess, onError) {
	let inserted = 0;
	let rejected = 0;
	let rejects = [];
	Promise.all(
		types.map(type => new Promise(
			resolve => Model.create({type: type})
				.then(ret => { ++inserted; resolve(ret)})
				.catch(err => {
					rejects.push({reject: type, error: err});
					++rejected;
					resolve(err);
				})
			)
		)
	).then(() => {
		const result = {insertedCount: inserted , rejectedCount: rejected, rejects: rejects };
		console.log(label+" insertion : "+JSON.stringify(result));
		onSuccess(result);
	}).catch(onError)
}

module.exports = seed;
