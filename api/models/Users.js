const mongoose = require('mongoose');
const crypto = require('crypto');
const { signToken } = require('#root/config/jwt_auth.js');

const { Schema } = mongoose;

const UsersSchema = new Schema({
    email: String,
    hash: String,
    salt: String,
});

UsersSchema.methods.setPassword = function(password) {
    this.salt = crypto.randomBytes(16).toString('hex');
    this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UsersSchema.methods.validatePassword = function(password) {
    const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
    return this.hash == hash; // === or == ? Sonarqube and IntelliJ disagree.
};

UsersSchema.methods.generateJWT = function() {
	return signToken({ email: this.email, id: this._id });
};

UsersSchema.methods.toAuthJSON = function() {
    return {
        _id: this._id,
        email: this.email,
        token: this.generateJWT(),
    };
};

UsersSchema.methods.toInfoJSON = function() {
    return {
        _id: this._id,
        email: this.email
    };
}

mongoose.model('Users', UsersSchema);
