const jwt = require('express-jwt');
const sec_string = 'secret';

const getTokenFromRequest = (req) => {
    const { headers: { authorization } } = req;

    if(authorization && authorization.split(' ')[0] === 'Token') {
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