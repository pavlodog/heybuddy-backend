const utilities = require('../lib/utilities'),
      wrapper = require('co-express'),
      request = require('request'),
      _User = require('../models/user'),
      _Notification = require('../models/notification'),
      _Session = require('../models/session'),
      _Facebook = require('../lib/facebook'),
      config = require('../config'),
      twilio = require('twilio');

const userModule = {
    /*
    userInfo : user information
    pushid : push token
    */
    signUp : wrapper( function*(req, res) {
            const { email, password, pin, profile, pushId, avatarData, avatarExtend } = req.body
            var hashedPassword = yield utilities.getHashPassword( password ) //Hash Password
            
            var newNotification = new _Notification( ) //New Empty Notification Document
            yield newNotification.saveToDataBase()

            if ( avatarData && avatarExtend ) {
                var avatarUrl = yield utilities.uploadMedia( 'profile', avatarData, avatarExtend )
                profile.avatarUrl = avatarUrl
            }

            var newUser = new _User({
                email : email,
                password : hashedPassword,
                pin : pin,
                profile : profile,
                notificationId : newNotification._id
            }) //New User with Notification
            yield newUser.saveToDataBase()
            
            var newSession = new _Session({
                userId : newUser._id,
                pushId : pushId
            });
            yield newSession.saveToDataBase();

            var accessToken = utilities.generateJWT(newUser.email);
            return res.send({ 
                        success: true , 
                        accessToken : accessToken, 
                        sessionId : newSession._id, 
                        user : newUser._doc, 
                        message : 'User registration success!', 
                        error : {} 
                    });
        }),
    /*
    email : login request email
    password : login request password
    pushid : push token
    */
    login : wrapper( function*(req, res) {
            var email = req.body.email;
            var passFromClient = req.body.password;
            var pushID = req.body.pushid;

            var user = yield _User.findOneByEmail(email);
            if ( user ) {
                var isPasswordMatch = yield utilities.comparePassword( passFromClient, user.password );

                if ( isPasswordMatch ) {
                    //Remove old session
                    var oldSession = yield _Session.findSessionByUserID( user._id );
                    if( oldSession ) {
                        yield oldSession.removeFromDataBase();
                    }
                    // New session create
                    var newSession = new _Session({
                        userId : user._id,
                        pushId : pushID
                    });
                    yield newSession.saveToDataBase();

                    var accessToken = utilities.generateJWT(user.email);
                    return res.send({ success : true, accessToken : accessToken, sessionId : newSession._id, user : user._doc, message : 'Login Success!' });
                }
                else {
                    return res.send({ success : false, accessToken : '', sessionId : '', user : {}, message : 'Password is incorrect!' });
                }
            }
            else {
                return res.send({ success : false, accessToken : '', sessionId : '', user : {}, message : 'User not exist!' });
            }
        }),
    loginWithFacebook : wrapper( function*(req, res) {
            const { facebookId, facebookToken, pushID } = req.body;
            console.log(req.body)
            var user = yield _User.findUserByFacebookId(facebookId);
            if( user ) {
                var oldSession = yield _Session.findSessionByUserID( user._id );
                if( oldSession ) {
                    yield oldSession.removeFromDataBase();
                }
                // New session create
                var newSession = new _Session({
                    userId : user._id,
                    pushId : pushID
                });
                yield newSession.saveToDataBase();

                var accessToken = utilities.generateJWT(user.email);
                return res.send({ success : true, accessToken : accessToken, sessionId : newSession._id, user : user._doc, message : 'Login Success!' });
            }
            else {
                console.log('getting access token')
                var token = yield _Facebook.getAccessToken();
                console.log(token)
                if( yield _Facebook.validateClientToken(token, facebookToken) ) {
                    var profile = yield _Facebook.getFacebookProfile(facebookId, token);
                    console.log(profile)
                    return res.send({ success : false, accessToken : '', sessionId : '', user : {}, message : 'User not exist!' });
                }
                else {
                    return res.send({ success : false, accessToken : '', sessionId : '', user : {}, message : 'User not exist!' });
                }
            }
        }),
    loginWithGoogle : wrapper( function*(req, res) {
            const { googleId, googleToken, serverAuthCode, pushID, profile } = req.body;
            var user = yield _User.findUserByGoogleId(googleId);
            if( user ) {
                var oldSession = yield _Session.findSessionByUserID( user._id );
                if( oldSession ) {
                    yield oldSession.removeFromDataBase();
                }
                // New session create
                var newSession = new _Session({
                    userId : user._id,
                    pushId : pushID
                });
                yield newSession.saveToDataBase();

                var accessToken = utilities.generateJWT(user.email);
                return res.send({ success : true, accessToken : accessToken, sessionId : newSession._id, user : user._doc, message : 'Login Success!' });
            }
            else {
                var newNotification = new _Notification( ); //New Empty Notification Document
                yield newNotification.saveToDataBase();

                var newUser = new _User(profile)
                newUser.updateField( 'notificationId', newNotification._id );
                yield newUser.saveToDataBase();
                
                var newSession = new _Session({
                    userId : newUser._id,
                    pushId : pushID
                });
                yield newSession.saveToDataBase();

                var accessToken = utilities.generateJWT(newUser.email);
                return res.send({ 
                            success: true , 
                            accessToken : accessToken, 
                            sessionId : newSession._id, 
                            user : newUser._doc, 
                            message : 'User Login with Google+ success!', 
                            error : {} 
                        });
            }
        }),
    loginWithTwitter : wrapper(function*(req, res) {
            const { twitterId, authToken, authTokenSecret, pushID } = req.body;
            var user = yield _User.findUserByTwitterId(twitterId);

            if( user ) {
                var oldSession = yield _Session.findSessionByUserID( user._id );
                if( oldSession ) {
                    yield oldSession.removeFromDataBase();
                }
                // New session create
                var newSession = new _Session({
                    userId : user._id,
                    pushId : pushID
                });
                yield newSession.saveToDataBase();

                var accessToken = utilities.generateJWT(user.twitterId);
                return res.send({ success : true, accessToken : accessToken, sessionId : newSession._id, user : user._doc, message : 'Login Success!' });
            }
            else {
                var newNotification = new _Notification( ); //New Empty Notification Document
                yield newNotification.saveToDataBase();

                var newUser = new _User({ twitterId : twitterId, email : twitterId })
                newUser.updateField( 'notificationId', newNotification._id );
                yield newUser.saveToDataBase();
                
                var newSession = new _Session({
                    userId : newUser._id,
                    pushId : pushID
                });
                yield newSession.saveToDataBase();

                var accessToken = utilities.generateJWT(newUser.email);
                return res.send({ 
                            success: true , 
                            accessToken : accessToken, 
                            sessionId : newSession._id, 
                            user : newUser._doc, 
                            message : 'User Login with Google+ success!', 
                            error : {} 
                        });
            }
        }),

    reverseTwitter : wrapper(function*(req, res) {
            request.post({
                url: 'https://api.twitter.com/oauth/request_token',
                oauth: {
                    oauth_callback: "http%3A%2F%2Flocalhost%3A3000%2Ftwitter-callback",
                    consumer_key: config.TWITTER_CONSUMER_KEY,
                    consumer_secret: config.TWITTER_CONSUMER_SECRET_KEY
                }
            }, function (err, r, body) {
                if (err) {
                    return res.send(500, { message: err.message });
                }
        
        
                var jsonStr = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
                res.send(JSON.parse(jsonStr));
            });
        }),
    authTwitter : wrapper(function*(req, res, next) {
            request.post({
                url: `https://api.twitter.com/oauth/access_token?oauth_verifier`,
                oauth: {
                    consumer_key: config.TWITTER_CONSUMER_KEY,
                    consumer_secret: config.TWITTER_CONSUMER_SECRET_KEY,
                    token: req.query.oauth_token
                },
                form: { oauth_verifier: req.query.oauth_verifier }
            }, function (err, r, body) {
                if (err) {
                    return res.send(500, { message: err.message });
                }
        
                console.log(body);
                const bodyString = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
                const parsedBody = JSON.parse(bodyString);
        
                req.body['oauth_token'] = parsedBody.oauth_token;
                req.body['oauth_token_secret'] = parsedBody.oauth_token_secret;
                req.body['user_id'] = parsedBody.user_id;
        
                next();
            });
        }),
    /*
    sessionId : session id
    newStatus : new status 0,1
    */
    setAvailability : wrapper(function*(req, res) {
            var sessionId = req.body.sessionId;
            var newStatus = req.body.newStatus;
            var session = yield _Session.findSessionByID( sessionId );

            session.updateField( 'status', newStatus );
            yield session.saveToDataBase();
            return res.send({ success : true });
        }),

    getProfile : wrapper( function*(req, res) {
            res.send({ success : true, user : req.session.user._doc, error : {}, message : '' });
        }),

    setLocations : wrapper( function*(req, res) {
            var user = req.session.user;
            var locations = req.body.locations;

            user.updateField('locations', locations);
            yield user.saveToDataBase();
            res.send({ success : true, user : user._doc, error : {}, message : 'Successfully updated!' });
        }),
    sendCode : wrapper(function*(req, res) {
            const { phoneNumber, text } = req.body;
            var client = new twilio(config.TWILIO_ACCOUNT_SID, config.TWILIO_AUTH_TOKEN);
            var user = yield _User.findUserByPhoneNumber(phoneNumber)
            if( user ) {
                client.messages.create({
                    body: text,
                    to: phoneNumber,  // Text this number
                    from: '+12345678901' // From a valid Twilio number
                })
                .then((message) => {
                    console.log(message.sid);
                    res.send({ success : true, error : {}, message : 'Successfully sent!'});
                }).catch( error => {
                    console.log(error)
                    res.send({ success : false, error : error, message : 'Sending code failed!'});
                })
            }
            else {
                res.send({ success : false, error : { message : 'failed because of user not found' }, message : 'User not found!'});
            }
        }),
    changePassword : wrapper(function*(req, res) {
            const { phoneNumber, newPass } = req.body
            var user = yield _User.findUserByPhoneNumber(phoneNumber)
            if( user ) {
                var hashedPassword = yield utilities.getHashPassword( newPass )
                user.updateField('password', hashedPassword)
                yield user.saveToDataBase()
                res.send({ success : true, error : {}, message : 'Successfully changed!' })
            }
            else {
                res.send({ success : false, error : { message : 'failed because of user not found' }, message : 'User not found!' })
            }
        })
}

module.exports = userModule;