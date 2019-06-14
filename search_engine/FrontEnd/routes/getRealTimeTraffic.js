const express = require('express');
const navBar = require('./navigationHeaders');
const client = require('./../mongoConnection').getDb();

const db = client.db('iotcrawler');

const router = express.Router();
let rawData = [];
let rawData2 = [];

router.get('/', (req, res) => {
    const getReportIds = [];
    const getRoundNames = [];
    /* Get Pattern Type */
    let patternTypeInput = req.query.patternTypeInput;

    /** Get the Time Range */
    const timeRange = req.query.timeRangeInput; // Todo

    if (patternTypeInput === 'High') {
        patternTypeInput = 'High Traffic';
    } else if (patternTypeInput === 'Medium') {
        patternTypeInput = 'Medium Traffic';
    } else if (patternTypeInput === 'Low') {
        patternTypeInput = 'Low Traffic';
    }
    if (patternTypeInput !== 'None') {
        db.collection('realTimeTraffic', (collectionError, collection) => {
            collection.find({ trafficStatus: patternTypeInput })
                .sort({ $natural: -1 })
                .limit(60)
                .toArray((error, items) => {
                    if (error) throw error;
                    rawData = items;
                });
            rawData.forEach((reportIDs) => {
                getReportIds.push(reportIDs.REPORT_ID);
            });
        });
        db.collection('realTimeTrafficRoute', (collectionError, collection) => {
            getReportIds.forEach((id) => {
                collection.find({ REPORT_ID: id })
                    .sort({ $natural: -1 })
                    .toArray((error, items) => {
                        if (error) {
                            throw error;
                        } else {
                            rawData2.push(items);
                        }
                    });
            });
        });
        rawData2.splice(getReportIds.length);

        rawData2 = [].concat.apply([], rawData2);// Flatten array to one level

        res.render('searchResultsRealTimeTraffic', {
            nav: navBar.nav,
            title: 'Real Time Traffic',
            data: rawData,
        });
    } else {
        db.collection('realTimeTraffic', (collectionError, collection) => {
            collection.find({})
                .sort({ $natural: -1 })
                .limit(11)
                .toArray((error, items) => {
                    if (error) throw error;
                    rawData = items;
                });
        });

        db.collection('realTimeTrafficRoute', (collectionError, collection) => {
            getReportIds.forEach((id) => {
                collection.find({ REPORT_ID: id })
                    .sort({ $natural: -1 })
                    .toArray((error, items) => {
                        if (error) throw error;
                        getRoundNames.push(items);
                    });
            });
        });
        console.log(`This is the total size of the ${getRoundNames.length}`);
        res.render('searchResultsRealTimeTraffic', {
            nav: navBar.nav,
            title: 'Real Time Traffic',
            data: rawData,
            roadInformation: getRoundNames,
        });
    }
});

/* Sending the processed data via a different route */
router.get('/rawData', (req, res) => {
    res.send({ rawData });
});

module.exports = router;
