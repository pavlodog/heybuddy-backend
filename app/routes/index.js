const express = require('express'),
    router = express.Router(),
    userRouter = require('./user'),
    buddyRouter = require('./buddy'),
    companyRouter = require('./company')
    chatRouter = require('./chat'),
//export router
module.exports = router;

router.get('/', (req, res) => {
    res.render('pages/home');
})

userRouter(router);
buddyRouter(router);
companyRouter(router);
chatRouter(router);