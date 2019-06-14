const express = require('express');
const client = require('./../mongoConnection').getDb();

const db = client.db('iotcrawler');
const navBar = require('./navigationHeaders');

const router = express.Router();
let rawData;
let averageGarageSpaces;


// Get the latest 11 readings
/* I am collecting 11 readings at a time because i only receieve from the API
So this means that  when i query the database i only want to get the latest 11, using (-1)
* */
db.collection('parkingSpaces', (collectionError, collection) => {
    collection.find().sort({ $natural: -1 }).limit(11).toArray((error, items) => {
        if (error) {
            throw error;
        } else {
            rawData = items;
            console.log(Object.keys(items[0]));
        }
    });

    // Within this query here i'm calculating the average spaces for each car park
    // TODO- This will allow me to know if the car park is full or not *
    collection.aggregate(
        [
            {
                $group: {
                    _id: '$garageCode',
                    avgSpaces: { $avg: '$totalSpaces' },
                },
            },
        ],
    ).toArray((error, items) => {
        if (error) {
            throw error;
        } else {
            averageGarageSpaces = items;
        }
    });
});

/* GET home.js page. */
router.get('/', (req, res) => {
    res.render('mapView', {
        nav: navBar.nav,
        title: 'IoT Crawler',
        data: rawData,
    });
});

router.get('/rawData', (req, res) => {
    res.send({ rawData });
});


module.exports = router;
