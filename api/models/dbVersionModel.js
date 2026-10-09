const mongoose = require('mongoose');
const { Schema } = mongoose;

// Version of the data schema, a single document { _id: 'schema' } (see api/migrations).
// No document : the database is at version 1 (before the versioning).
const DbVersionSchema = new Schema({
	_id: {
		type: String
	},
	version: {
		type: Number,
		required: true
	},
	migratedAt: {
		type: Date,
		required: false
	}
},{
	versionKey: false
});

module.exports = mongoose.model('DbVersion', DbVersionSchema);
