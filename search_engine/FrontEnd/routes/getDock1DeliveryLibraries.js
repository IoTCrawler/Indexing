const express = require('express');
const narBar = require('./navigationHeaders');

const router = express.Router();

router.get('/', (req, res, next) => {
    res.render('dock1DeliveryLibraries', {
        nav: narBar.nav,
        title: 'Home Page for City Labs',
    });
});

module.exports = router;
