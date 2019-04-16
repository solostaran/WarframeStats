const jwt = require('express-jwt');
const sec_string = 'secret';

const getTokenFromRequest = (req) => {
    const { headers: { authorization } } = req;

    // In order to provide CSRF protection,
    // check here Referer and Origin headers to see if they are related to your application

    const auth_prefix = authorization.split(' ')[0];
    if (authorization && (auth_prefix === 'Token' || auth_prefix === 'Bearer')) {
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