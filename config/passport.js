const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');

const Users = mongoose.model('Users');

passport.use(new LocalStrategy({
    usernameField: 'user[email]',
    passwordField: 'user[password]'
    //, passReqToCallback: true // means that the first argument of the callback will be 'req'
}, (email, password, done) => {
    Users.findOne({ email: email })
        .then((user) => {
            if(!user || !user.validatePassword(password)) {
                if (!user)
                    return done(null, false, { errors: { email: 'is invalid' } });
                else
                    return done(null, false, { errors: { password: 'is invalid' } });
            }

            return done(null, user);
        }).catch(done);
}));
