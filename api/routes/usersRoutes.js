const mongoose = require('mongoose');
const passport = require('passport');
const router = require('express').Router();
const { auth, setAccessTokenCookie } = require('#root/security/jwt_auth.js');
const Users = mongoose.model('Users');
const { obfuscate_email } = require('#root/security/utils/obfuscation.js');

// No sign-up route : a user is created with resources/scripts/CreateUser.js

//POST login route (optional, everyone has access)
router.post('/login', auth.optional, (req, res, next) => {
	const user = (req.body && req.body.user) || {};	// no body or no "user" object : the checks below answer "is required"

	if(!user.email) {
		return res.status(422).json({
			errors: {
				error_email: 'is required',
			},
		});
	}

	if(!user.password) {
		return res.status(422).json({
			errors: {
				error_password: 'is required',
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
			console.log(new Date().toISOString()+" | User '"+obfuscate_email(user.email)+"' logged.");
			return res.json({ user: user.toAuthJSON() });
		}

		return res.status(400).json(info);
	})(req, res, next);
});

//GET current route (required, only authenticated users have access)
router.get('/current', auth.required, (req, res) => {
	const { auth: { id } } = req;

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

router.get('/loginForm', auth.optional, function(_req, res) {
	res.render('login', { title: "Login"});
});

router.post('/loginFormProcess', auth.optional, function(req, res, next) {
// router.post('/loginFormProcess', function(req, res, next) {
	const user = (req.body && req.body.user) || {};	// no body or no "user" object : the checks below answer "is required"

	if(!user.email) {
		res.render('login', {
			errors: {
				error_email: 'is required',
			},
		});
		return;
	}

	if(!user.password) {
		res.render('login',{
			email: user.email,
			errors: {
				error_password: 'is required',
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

			// Cookie access token (the login state of the PUG templates is computed per request by security/loginState.js)
			setAccessTokenCookie(res, user.token);
			console.log(new Date().toISOString()+" | User '"+obfuscate_email(user.email)+"' logged.");
			res.render('logged', { title: 'connected', connected: true, user: user.toAuthJSON() });
			return;
		}
		info.email = user.email;
		res.render('login', info);
	})(req, res, next);
});

router.get('/disconnect', auth.optional, function(req, res) {
	if (req.auth) {
		const { auth: { id } } = req;
		Users.findById(id)
			.then((user) => {
				if(!user) {
					return res.sendStatus(400);
				}
				res.clearCookie('access_token');
				console.log(new Date().toISOString()+" | User '"+obfuscate_email(user.email)+"' disconnected.");
				// the cookie is cleared by this response : the page is already disconnected
				res.render('disconnected', {title: 'Disconnect', user: user.toAuthJSON(), connected: false});
			});
	} else {
		res.render('expired', {title: 'Expired', connected: false});
	}



});

module.exports = router;
