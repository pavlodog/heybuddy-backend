const mongoose = require('mongoose'),
      Schema = mongoose.Schema;

// create a schema
const userSchema = new Schema({
    email : { 
        type: String, 
        required: true,
        unique: true 
    },
    userType : {
        type : String,
        default : 'Individual'
    },
    password : {
        type : String,
        default : ''
    },
    pin : {
        type : String,
        default : ''
    },
    social : {
        facebookId: {
            type: String,
        },
        googleId: {
            type: String,
        },
        twitterId : {
            type : String
        }
    },
    profile : {
        firstName : {
            type : String,
            default : ''
        },
        lastName : {
            type : String,
            default : ''
        },
        avatarUrl : {
            type : String,
            default : ''
        },
        phoneNumber : {
            type : String,
            default : ''
        },
        dateOfBirth : {
            type : String,
            default : ''
        },
        position : {
            latitude : {
                type : Number,
                default : 0
            },
            longitude : {
                type : Number,
                default : 0
            }
        }
    },
    settings : {
        language : {
            type : String,
            default : 'eng'
        },
        isNotificationEnabled : {
            type : Boolean,
            default : true
        },
        isPosPrivate : {
            type : Boolean,
            default : false
        },
        invisibleMode : {
            type : Boolean,
            default : false
        },
        preWrittenMessage : {
            type : String,
            default : ''
        }
    },
    companies : {
        type : Array,
        default : []
    },
    emergencies : {
        type : Array,
        default : []
    },
    meetups : {
        type : Array,
        default : []
    },
    anonymousTips : {
        type : Array,
        default : []
    },
    timers : {
        type : Array,
        default : []
    },
    newsFeeds : {
        type : Array,
        default : []
    },
    chats : {
        type : Array,
        default : []
    },
    buddies : {
        type : Array,
        default : []
    },
    buddyRequests : {
        type : Array,
        default : []
    },
    pendingRequests : {
        type : Array,
        default : []
    },
    notificationId : {
        type : Schema.Types.ObjectId,
        ref: 'notification',
    }
});

userSchema.methods.updateField = function( key, value ) {
    this[key] = value;
}

userSchema.methods.saveToDataBase = function( ) {
    return new Promise((resolve, reject) => {
        this.save(function(err){
            if(err) reject(err);
            else resolve();
        })
    });
}

// create the model
const userModel = mongoose.model('user', userSchema);

userModel.findOneByCondition = function( condition ) {
    return new Promise( (resolve, reject) => {
        userModel.findOne( condition , (err, res) => {
            if(err) reject(err)
            else resolve(res)
        })
    })
}

userModel.findOneByEmail = function( cemail ) {
    return new Promise( ( resolve, reject ) => { 
        userModel.findOne({ email : cemail }, (err, res) => {
            if(err) reject(err);
            else resolve(res);
        });
    });
}

userModel.findOneById = function( id ) {
    return new Promise( ( resolve, reject ) => { 
        userModel.findOne({ _id : id }, (err, res) => {
            if(err) reject(err);
            else resolve(res);
        });
    });
}

userModel.findUserByFacebookId = function( facebookId ) {
    return new Promise( (resolve, reject) => {
        userModel.findOne({ facebookId : facebookId }, (err, res) => {
            if(err) reject(err);
            else resolve(res);
        })
    })
}

userModel.findUserByGoogleId = function( googleId ) {
    return new Promise( (resolve, reject) => {
        userModel.findOne({ googleId : googleId }, (err, res) => {
            if(err) reject(err);
            else resolve(res);
        })
    })
}

userModel.findUserByTwitterId = function( twitterId ) {
    return new Promise( (resolve, reject) => {
        userModel.findOne( { twitterId : twitterId }, (err, res) => {
            if(err) reject(err)
            else resolve(res)
        })
    })
}

userModel.findUserByPhoneNumber = function( phoneNumber ) {
    return new Promise( (resolve, reject) => {
        userModel.findOne({ phonenumber : phoneNumber }, (err, res) => {
            if(err) reject(err)
            else resolve(res)
        })
    })
}

userModel.findUsersByName = function( name, me ) {
    return new Promise( (resolve, reject) => {
        userModel.find((error, users) => {
            if(error) reject(error);
            else {
                var result = [];
                users.map( element => {
                    var fullName1 = element.firstname + element.lastname;
                    var fullName2 = element.firstname + ' ' + element.lastname;
                    if( element.firstname.includes(name) || element.lastname.includes(name) || fullName1.includes(name) || fullName2.includes(name) ) {
                        if( element.email !== me.email )
                        {
                            result.push(element);
                        }
                    }
                });
                resolve(result);
            }
        });
    });
}

userModel.upsertTwitterUser = function(token, tokenSecret, profile, cb) {
    var that = this;
    return this.findOne({
      'twitterProvider.id': profile.id
    }, function(err, user) {
      // no user was found, lets create a new one
      if (!user) {
        var newUser = new that({
          email: profile.emails[0].value,
          twitterProvider: {
            id: profile.id,
            token: token,
            tokenSecret: tokenSecret
          }
        });

        newUser.save(function(error, savedUser) {
          if (error) {
            console.log(error);
          }
          return cb(error, savedUser);
        });
      } else {
        return cb(err, user);
      }
    });
};

// export the model
module.exports = userModel;