const express = require('express');
const client = require('./../mongoConnection').getDb();

const db = client.db('iotcrawler');
const navBar = require('./navigationHeaders');

const router = express.Router();

let rawData;

// Get the latest 11 readings
db.collection('airPollutionBanegardsgade', (collectionError, collection) => {
    // collection.find().sort({ $natural: -1 }).limit(11).toArray((error, items) => {
    collection.find().toArray((error, items) => {
        if (error) {
            throw error;
        } else {
            rawData = items;
        }
    });
});

/* GET home.js page. */
router.get('/', (req, res) => {
    res.render('airPollutionBanegardsgade', {
        nav: navBar.nav,
        title: 'Air Pollution',
        data: rawData,
    });
});

router.get('/rawData', (req, res) => {
    res.send({ rawData });
});
module.exports = router;
