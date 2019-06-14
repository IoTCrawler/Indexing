const express = require('express');
const navBar = require('./navigationHeaders');

const router = express.Router();
const client = require('./../mongoConnection')
    .getDb();

const db = client.db('iotcrawler');

let rawData;
let pirDataTwo;
let pirDataThree;
let doorDataTwo;


router.get('/latestReading', (req, res) => {
    db.collection('livingLab', (collectionError, collection) => {
        collection.find({ sensorID: 'Door 2' })
            .sort({ $natural: -1 })
            .limit(10)
            .toArray((error, items) => {
                if (error) {
                    throw error;
                } else {
                    res.send({ items });
                }
            });
    });
});

router.get('/doorTwo', (req, res) => {
    db.collection('livingLab', (collectionError, collection) => {
        collection.find({ sensorID: 'Door 2' })
            .sort({ $natural: -1 })
            .limit(10)
            .toArray((error, items) => {
                if (error) {
                    throw error;
                } else {
                    res.send({ items });
                }
            });
    });
});

router.get('/pirTwo', (req, res) => {
    db.collection('livingLab', (collectionError, collection) => {
        collection.find({ sensorID: 'PIR 2' })
            .sort({ $natural: -1 })
            .limit(10)
            .toArray((error, items) => {
                if (error) {
                    throw error;
                } else {
                    pirDataTwo = items;
                    res.send({ items });
                }
            });
    });
});


router.get('/pirThree', (req, res) => {
    db.collection('livingLab', (collectionError, collection) => {
        collection.find({ sensorID: 'PIR 3' })
            .sort({ $natural: -1 })
            .limit(10)
            .toArray((error, items) => {
                if (error) {
                    throw error;
                } else {
                    pirDataThree = items;
                    res.send({ items });
                }
            });
    });
});

router.get('/', (req, res, next) => {
    db.collection('livingLab', (collectionError, collection) => {
        collection.find({})
            .sort({ $natural: -1 })
            .limit(10)
            .toArray((error, items) => {
                if (error) {
                    throw error;
                } else {
                    rawData = items;
                }
            });
    });
    res.render('environmentalDataCVSSSP', {
        nav: navBar.nav,
        title: 'IoT Crawler',
        data: rawData,
    });
});


module.exports = router;
