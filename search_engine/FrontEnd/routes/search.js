const express = require('express');
const async = require('async');
const Geohash = require('latlon-geohash');
const client = require('./../mongoConnection').getDb();
const navBar = require('./navigationHeaders');

const db = client.db('iotcrawler');


const router = express.Router();

let rawData,
    dataSource1,
    dataSource2,
    dataSource3,
    trafficData,
    collectionName,
    lat,
    lng,
    readingTypeInput,
    patternTypeInput,
    timeRangeInput,
    timeRange = 0,
    patternType,
    searchStartDate,
    searchEndDate,
    sensorName,
    hash,
    dataType,
    neighboursObj,
    neighboursArr;

router.get('/', (req, res, next) => {
    res.render('search', {
        nav: navBar.nav,
    });
});

router.get('/searchResults', (req, res, next) => {
    // form controls here
    req.query.dataType = !req.query.dataType ? [] : req.query.dataType;
    const dataType = Array.isArray(req.query.dataType) ? req.query.dataType : [req.query.dataType];

    // Dates
    let searchStartDate = req.query.searchStartDate;
    let searchEndDate = req.query.searchEndDate;

    // SensorName
    const sensorName = req.query.sensorName;

    // Location
    lat = req.query.locationLat;
    lng = req.query.locationLng;
    let hash;
    let neighboursObj;
    let neighboursArr;

    // Convert Longitutde and latitude to Geohash
    if (lat && lng) {
        hash = Geohash.encode(lat, lng);
        console.log('This is the hash that the user has typed in from the browser', hash);

        neighboursObj = Geohash.neighbours(hash);
        neighboursArr = Object.keys(neighboursObj).map(n => neighboursObj[n]);
    }

    if (searchStartDate !== '' && searchEndDate !== '') {
        searchStartDate = new Date(searchStartDate);
        searchEndDate = new Date(searchEndDate);
    }


    const fns = dataType.reduce((acc, type) => {
        const collection = db.collection(type);
        const query = {}; // TODO
        console.log('This is the type', type);

        if (type === 'airPollutionBanegardsgade') {
            acc[type] = (done) => {
                if (searchStartDate) {
                    collection
                        .find({ Date: { $gte: searchStartDate, $lt: searchEndDate } })
                        .toArray(done);

                    collection
                        .find({ Date: { $gte: searchStartDate, $lt: searchEndDate } })
                        .toArray((error, items) => {
                            if (error) {
                                console.log(error);
                                throw error;
                            } else {
                                dataSource1 = items;
                            }
                        });
                } else if (hash) {
                    const geoHashQuery = `^${hash.substr(0, 5)}`; // /^u1zr2q/
                    const geoHashQuery2 = new RegExp(geoHashQuery);
                    console.log(geoHashQuery2);
                    collection
                        .find({ geoHash: geoHashQuery2 })
                        .toArray(done);
                    collection
                        .find({ geoHash: geoHashQuery2 })
                        .toArray((error, items) => {
                            dataSource2 = items;
                        });
                } else {
                    collection.find().sort({ $natural: -1 }).limit(10).toArray(done);
                    // collection.find({}).toArray(done);
                }
            };
        } else if (type === 'airPollutionBotanicalGarden') {
            acc[type] = (done) => {
                if (searchStartDate) {
                    collection
                        .find({ Date: { $gte: searchStartDate, $lt: searchEndDate } })
                        .toArray(done);
                } else {
                    collection
                        .find(query)
                        .sort({ $natural: -1 })
                        .limit(10)
                        .toArray(done);
                }
            };
        } else if (type === 'parkingSpaces') {
            acc[type] = (done) => {
                if (searchStartDate) {
                    collection
                        .find({ date: { $gte: searchStartDate, $lt: searchEndDate } })
                        .toArray(done);
                } else if (hash) {
                    const geoHashQuery = `^${hash.substr(0, 6)}`; // /^u1zr2q/
                    const geoHashQuery2 = new RegExp(geoHashQuery);
                    console.log(geoHashQuery2);
                    collection.find({ geoHash: geoHashQuery2 }).toArray(done);
                    collection.find({ geoHash: geoHashQuery2 }).toArray((error, items) => {
                        dataSource3 = items;
                    });
                } else {
                    collection.find().toArray(done);
                }
            };
        } else {
            // do something  else here
        }

        return acc;
    }, {});

    async.parallel(fns, (err, resultData) => {
        if (err) {
            return next(err);
        }
        const templateContext = Object.assign({ nav: navBar.nav, hash }, resultData);
        rawData = resultData;
        res.render('resultsMapView', templateContext);
    });
});

router.get('/rawData', (req, res) => {
    res.send({ rawData });
});

router.get('/dataSourceAirPollutionBanegardsgade', (req, res) => {
    res.send({ dataSource1 });
});

router.get('/dataSourceAirPollutionBotanicalGarden', (req, res) => {
    res.send({ dataSource2 });
});

router.get('/dataSourcePakring', (req, res) => {
    res.send({ dataSource3 });
});

router.get('/userCoordinates', (req, res) => {
    res.send({
        lat,
        lng,
    });
});

router.get('/averageTraffic', (req, res) => {
    res.send({ rawData });
});


module.exports = router;
