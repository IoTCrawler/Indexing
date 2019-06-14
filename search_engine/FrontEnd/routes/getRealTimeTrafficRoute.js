const express = require('express');
const client = require('./../mongoConnection').getDb();

const db = client.db('iotcrawler');


const router = express.Router();
let rawData = [];

// Get the latest 11 readings
db.collection('realTimeTrafficRoute', (collectionError, collection) => {
    collection.find({
            $and: [{ POINT_1_CITY: { $nin: [null, ''] } },
                { POINT_1_LAT: { $nin: [null, ''] } },
                { POINT_1_STREET: { $nin: [null, ''] } },
                { POINT_2_STREET: { $nin: [null, ''] } },
            ],
        }).toArray((error, items) => {
        if (error) {
            throw error;
        } else {
            rawData = items;
            console.log(`***${items.length}`);
        }
    });
});

router.get('/rawData', (req, res) => {
    res.send({ rawData });
});
module.exports = router;
