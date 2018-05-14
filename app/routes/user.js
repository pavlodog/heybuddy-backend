const userController = require('../controllers/user.controller'),
      utilities = require('../lib/utilities'),
      passport = require('passport'),
      _AuthCheck = require('../auth');

var generateToken = function (req, res, next) {
    req.token = utilities.generateJWT(req.auth);
    return next();
};

var sendToken = function (req, res) {
    res.setHeader('x-auth-token', req.token);
    return res.status(200).send(JSON.stringify(req.user));
};

module.exports = ( router ) => {
    router.post( '/user/login', userController.login );
    router.post( '/user/login/facebook', userController.loginWithFacebook);
    router.post( '/user/login/google', userController.loginWithGoogle);
    router.post( '/user/login/twitter', userController.loginWithTwitter);
    router.post( '/user/auth/twitter/reverse', userController.reverseTwitter);
    router.get( '/user/auth/twitter', userController.authTwitter, 
        passport.authenticate('twitter-token', {session: false}), function(req, res, next) {
            if (!req.user) {
                return res.send(401, 'User Not Authenticated');
            }

            // prepare token for API
            req.auth = {
                id: req.user.id
            };

            return next();
        },
        generateToken,
        sendToken
    );
    router.post( '/user/sendcode', userController.sendCode);
    router.post( '/user/changepassword', userController.changePassword);
    router.post( '/user/signup', userController.signUp );
    router.post( '/user/setavailability', userController.setAvailability);
    router.post( '/user/setlocations', _AuthCheck, userController.setLocations);
    router.post( '/user/profile', _AuthCheck, userController.getProfile );
}