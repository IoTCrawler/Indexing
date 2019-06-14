const express = require('express');
const navBar = require('../navigationHeaders');

const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('visualization/cityOfAarhusDark', {
        nav: navBar.nav,
        title: 'IoT Crawler',
    });
});

module.exports = router;
