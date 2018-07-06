const express = require('express'),
    router = express.Router(),
    userRouter = require('./user'),
    buddyRouter = require('./buddy'),
    companyRouter = require('./company')
    chatRouter = require('./chat'),
    incidentRouter = require('./incident'),
    anonymoustipRouter = require('./anonymoustip'),
    newsfeedRouter = require('./newsfeed'),
    meetupRouter = require('./meetup'),
    searchRouter = require('./search'),
    todoRouter = require('./todo'),
    charRouter = require('./chart'),
    calendareventRouter = require('./calendarevent')
//export router
module.exports = router;

router.get('/', (req, res) => {
    res.render('pages/home');
})

userRouter(router);
buddyRouter(router);
companyRouter(router);
chatRouter(router);
incidentRouter(router);
anonymoustipRouter(router)
newsfeedRouter(router)
meetupRouter(router)
searchRouter(router)
todoRouter(router)
calendareventRouter(router)
charRouter(router)