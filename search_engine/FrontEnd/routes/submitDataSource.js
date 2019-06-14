const express = require('express');
const navBar = require('./navigationHeaders');

const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('submitData', {
        nav: navBar.nav,
        title: 'IoT Crawler',
    });
});

router.get('/success', (req, res, next) => {
    res.render('thankYou', {
        nav: navBar.nav,
        title: 'IoT Crawler',
    });
});
module.exports = router;
