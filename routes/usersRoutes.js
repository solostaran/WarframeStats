const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const auth = require('../config/jwt_auth').auth;
const Users = mongoose.model('Users');

//POST new user route (optional, everyone has access)
if (!(process.env.NODE_ENV === 'production')) {
    router.post('/', auth.optional, (req, res) => {
        const { body: { user } } = req;

        if(!user.email) {
            return res.status(422).json({
                errors: {
                    email: 'is required',
                },
            });
        }

        if(!user.password) {
            return res.status(422).json({
                errors: {
                    password: 'is required',
                },
            });
        }

        const finalUser = new Users(user);

        finalUser.setPassword(user.password);

        return finalUser.save()
            .then(() => res.json({ user: finalUser.toAuthJSON() }));
    });
}

//POST login route (optional, everyone has access)
router.post('/login', auth.optional, (req, res, next) => {
    const { body: { user } } = req;

    if(!user.email) {
        return res.status(422).json({
            errors: {
                email: 'is required',
            },
        });
    }

    if(!user.password) {
        return res.status(422).json({
            errors: {
                password: 'is required',
            },
        });
    }

    return passport.authenticate('local', { session: false }, (err, passportUser, info) => {
        if(err) {
            return next(err);
        }

        if(passportUser) {
            const user = passportUser;
            user.token = passportUser.generateJWT();
            console.log(new Date().toISOString()+" | User '"+user.email+"' logged.");
            return res.json({ user: user.toAuthJSON() });
        }

        return res.status(400).json(info);
    })(req, res, next);
});

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res) => {
    const { payload: { id } } = req;

    return Users.findById(id)
        .then((user) => {
            if(!user) {
                return res.sendStatus(400);
            }

            return res.json({ user: user.toAuthJSON() });
        });
});

// delete all users
// router.delete('/deleteAll', auth.optional, (req, res, next) => {
//     Users.collection.deleteMany({}).then(ret => res.status(200).send(ret));
// });

router.get('/loginForm', auth.optional, function(req, res) {
    res.render('login', { title: "Login"});
});

router.post('/loginFormProcess', auth.optional, function(req, res, next) {
    const { body: { user } } = req;

    if(!user.email) {
        res.render('login', {
            errors: {
                email: 'is required',
            },
        });
        return;
    }

    if(!user.password) {
        res.render('login',{
            errors: {
                password: 'is required',
            },
        });
        return;
    }

    passport.authenticate('local', { session: false }, (err, passportUser, info) => {
        if(err) {
            return next(err);
        }

        if(passportUser) {
            const user = passportUser;
            user.token = passportUser.generateJWT();

            // Cookie access token and connexion management
            req.app.locals.connected = true;    // For PUG templates
            res.cookie('access_token', user.token, { httpOnly: true, maxAge: 3600000}); // 1 hour
            console.log(new Date().toISOString()+" | User '"+user.email+"' logged.");
            res.render('logged', { title: 'connected', connected: true, user: user.toAuthJSON() });
            return;
        }
        res.render('login', info);
    })(req, res, next);
});

router.get('/disconnect', auth.required, function(req, res) {
    const { payload: { id } } = req;
    Users.findById(id)
        .then((user) => {
            if(!user) {
                return res.sendStatus(400);
            }
            req.app.locals.connected = false; // For PUG templates
            res.clearCookie('access_token');
            console.log(new Date().toISOString()+" | User '"+user.email+"' disconnected.");
            res.render('disconnected', {title: 'Disconnect', user: user.toAuthJSON()});
        });


});

module.exports = router;
