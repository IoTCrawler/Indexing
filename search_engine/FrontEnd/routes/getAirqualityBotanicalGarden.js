const express = require('express');
const client = require('./../mongoConnection').getDb();

const db = client.db('iotcrawler');
const navBar = require('./navigationHeaders');

const router = express.Router();

let rawData;

db.collection('airPollutionBotanicalGarden', (collectionError, collection) => {
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
    res.render('airPollutionBotanicalGarden', {
        nav: navBar.nav,
        title: 'Air Pollution',
        data: rawData,
    });
});

router.get('/rawData', (req, res) => {
    console.log('Hello i been called', rawData);
    res.send({ rawData });
});
module.exports = router;
