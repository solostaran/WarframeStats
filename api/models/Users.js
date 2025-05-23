const mongoose = require('mongoose');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sec_string = require('../../config/jwt_auth').sec_string;

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
    return jwt.sign({
        email: this.email,
        id: this._id,
        exp: Math.floor( Date.now() / 1000) + (60 * 10), // 10 min
    }, sec_string);
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
