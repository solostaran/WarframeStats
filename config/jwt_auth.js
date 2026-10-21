const { expressjwt: jwt } = require('express-jwt'); // for express-jwt v8+
const jsonwebtoken = require('jsonwebtoken');
function generateRandomString(length) {
    let result = '';
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        result += charset.charAt(randomIndex);
    }
    return result;
}
const sec_string = generateRandomString(10);

// A session ends after this idle time : config/loginState.js renews the cookie token of an active user
const SESSION_DURATION_SECONDS = 30 * 60;
const RENEW_AFTER_SECONDS = 60;	// no new token for each request

function signToken({ email, id }) {
	return jsonwebtoken.sign({
		email: email,
		id: id,
		exp: Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS,
	}, sec_string);
}

function setAccessTokenCookie(res, token) {
	res.cookie('access_token', token, { httpOnly: true, sameSite: 'lax', maxAge: SESSION_DURATION_SECONDS * 1000 });
}

const getTokenFromRequest = (req) => {
    const { headers: { authorization } } = req;

    // In order to provide CSRF protection,
    // const { headers: { authorization, referer, origin } } = req;
    // check here Referer and Origin headers to see if they are related to your application
    // if (referer && !referer.toString().startsWith('https://localhost/') && !referer.toString().startsWith('http://localhost:3000/')) {
    //     console.log('bad referer : '+referer);
    //     return null;
    // }
    // if (origin && !origin.toString().startsWith('https://localhost/') && !origin.toString().startsWith('http://localhost:3000/')) {
    //     console.log('bad origin : '+origin);
    //     return null;
    // }

    if (authorization && (authorization.split(' ')[0] === 'Token' || authorization.split(' ')[0] === 'Bearer')) {
        return authorization.split(' ')[1];
    } else {
        let cookie_token = req.cookies['access_token'];
        if (cookie_token) return cookie_token;
    }
    return null;
};

const auth = {
    required: jwt({
        secret: sec_string,
        algorithms: ['HS256'],
        userProperty: 'payload',
        getToken: getTokenFromRequest,
    }),
    optional: jwt({ // allows us to define unprotected routes while still identifying registered users
        secret: sec_string,
        algorithms: ['HS256'],
        userProperty: 'payload',
        getToken: getTokenFromRequest,
        credentialsRequired: false,
    }),
};

exports.sec_string = sec_string;
exports.SESSION_DURATION_SECONDS = SESSION_DURATION_SECONDS;
exports.RENEW_AFTER_SECONDS = RENEW_AFTER_SECONDS;
exports.signToken = signToken;
exports.setAccessTokenCookie = setAccessTokenCookie;
exports.auth = auth;
