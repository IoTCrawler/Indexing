const express = require('express');
const navBar = require('./navigationHeaders');

const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('signUP', {
        nav: navBar.nav,
        title: 'IoT Crawler',
    });
});

module.exports = router;
