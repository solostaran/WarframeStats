const jwt = require('express-jwt');
const sec_string = 'secret';

const getTokenFromRequest = (req) => {
    const { headers: { authorization, referer, origin } } = req;

    // In order to provide CSRF protection,
    // check here Referer and Origin headers to see if they are related to your application
    if (referer && (!referer.toString().startsWith('https://localhost/') || !referer.toString().startsWith('http://localhost:3000/'))) return null;
    if (origin && (!origin.toString().startsWith('https://localhost/') || !origin.toString().startsWith('http://localhost:3000/'))) return null;

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
        userProperty: 'payload',
        getToken: getTokenFromRequest,
    }),
    optional: jwt({
        secret: sec_string,
        userProperty: 'payload',
        getToken: getTokenFromRequest,
        credentialsRequired: false,
    }),
};

exports.sec_string = sec_string;
exports.auth = auth;