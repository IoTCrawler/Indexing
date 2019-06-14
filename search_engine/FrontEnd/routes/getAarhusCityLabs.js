const express = require('express');
const client = require('./../mongoConnection').getDb();

const db = client.db('iotcrawler');
const navBar = require('./navigationHeaders');

const router = express.Router();

let rawData; // the rawDta
const dataSource1 = []; // Store all relevant data source for the "0004A30B001E307C" plaform
const dataSource2 = []; // Store all relevant data source for the "0004A30B001E8EA2" plaform
const dataSource3 = []; // Store all relevant data source for the "0004A30B001E1694" plaform

const dataSource1Last = [];
const dataSource2Last = [];
const dataSource3Last = [];
let a;

db.collection('aarhusCityLabs', (collectionError, collection) => {
    collection.find().sort({ $natural: -1 }).limit(500).toArray((error, items) => {
        if (error) {
            throw error;
        } else {
            for (let x = 0; x < items.length; x++) {
                if (items[x].sensor === '0004A30B001E307C') {
                    dataSource1.push(items[x]);
                } else if (items[x].sensor === '0004A30B001E8EA2') {
                    dataSource2.push(items[x]);
                } else if (items[x].sensor === '0004A30B001E1694') {
                    dataSource3.push(items[x]);
                }
            }
            rawData = items;
        }
    });
});


/* GET home.js page. */
router.get('/', (req, res) => {
    res.render('aarhusCityLabs', {
        nav: navBar.nav,
        title: 'City Labs',
        data: rawData,
        dataSource1, // 0004A30B001E307C
        dataSource2, // 0004A30B001E8EA2
        dataSource3, // 0004A30B001E1694
    });
});


router.get('/rawDataSource1', (req, res) => {
    res.send({ dataSource1 });
});

router.get('/rawDataSource2', (req, res) => {
    res.send({ dataSource2 });
});

router.get('/rawDataSource3', (req, res) => {
    res.send({ dataSource3 });
});

router.get('/rawData', (req, res) => {
    res.send({ rawData });
});
module.exports = router;
