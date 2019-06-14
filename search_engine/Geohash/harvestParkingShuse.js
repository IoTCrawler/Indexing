/* eslint-disable no-underscore-dangle,object-curly-spacing */
const uuidv4 = require('uuid/v4');
const MongoClient = require('mongodb').MongoClient;
const _ = require('lodash');
const request = require('request');
const geo = require('geo-hash');

// Done - Working
function goHarvest() {
    request('https://portal.opendata.dk/api/action/datastore_search?resource_id=2a82a145-0195-4081-a13c-b0e587e9b89c&limit=50',
        (error, response, body) => {
            if (error === null) {
                console.log('Happy days no error');
            } else {
                console.log('error:', error); // Print the error if one occurred
            }
            console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received

            const rawData = JSON.parse(body);
            const dataRecords = rawData.result.records;
            let availableSpaces = {};

            for (let x = 0; x < dataRecords.length; x += 1) {
                if (dataRecords[x].garageCode === 'NORREPORT') {
                    const lonLatNORREPORT = {lat: 56.161148, lng: 10.212163}; // Correct

                    dataRecords[x].availableSpaces = dataRecords[x].totalSpaces - dataRecords[x].vehicleCount;
                    const hash = geo.encode(56.161148, 10.212163);
                    dataRecords[x].geoHash = hash;
                    _.merge(dataRecords[x], lonLatNORREPORT);
                } else if (dataRecords[x].garageCode === 'SCANDCENTER') {
                    const lonLatSCANDCENTER = {lat: 56.153508, lng: 10.197048}; // Correct
                    dataRecords[x].availableSpaces = dataRecords[x].totalSpaces - dataRecords[x].vehicleCount;

                    const hash = geo.encode(56.153508, 10.197048);
                    dataRecords[x].geoHash = hash;

                    _.merge(dataRecords[x], lonLatSCANDCENTER);
                } else if (dataRecords[x].garageCode === 'BRUUNS') {
                    const lonLatBRUUNS = {lat: 56.149881, lng: 10.204749}; // Correct
                    dataRecords[x].availableSpaces = dataRecords[x].totalSpaces - dataRecords[x].vehicleCount;

                    const hash = geo.encode(56.149881, 10.204749);
                    dataRecords[x].geoHash = hash;

                    _.merge(dataRecords[x], lonLatBRUUNS);

                } else if (dataRecords[x].garageCode === 'MAGASIN') {
                    const lonLatMAGASIN = {lat: 56.157245, lng: 10.206867}; // Correct
                    dataRecords[x].availableSpaces = dataRecords[x].totalSpaces - dataRecords[x].vehicleCount;

                    const hash = geo.encode(56.157245, 10.206867);
                    dataRecords[x].geoHash = hash;

                    _.merge(dataRecords[x], lonLatMAGASIN);
                } else if (dataRecords[x].garageCode === 'KALKVAERKSVEJ') {
                    const lonLatKALKVAERKSVEJ = {lat: 56.149386, lng: 10.211934}; // Correct
                    dataRecords[x].availableSpaces = dataRecords[x].totalSpaces - dataRecords[x].vehicleCount;

                    const hash = geo.encode(56.149386, 10.211934);
                    dataRecords[x].geoHash = hash;

                    _.merge(dataRecords[x], lonLatKALKVAERKSVEJ);
                } else if (dataRecords[x].garageCode === 'SALLING') {
                    const lonLatSALLING = {lat: 56.154059, lng: 10.207567}; // Correct
                    dataRecords[x].availableSpaces = dataRecords[x].totalSpaces - dataRecords[x].vehicleCount;

                    const hash = geo.encode(56.154059, 10.207567);
                    dataRecords[x].geoHash = hash;

                    _.merge(dataRecords[x], lonLatSALLING);
                } else if (dataRecords[x].garageCode === 'DOKK1') {
                    const lonLatDOKK1 = {lat: 56.153492, lng: 10.214054}; // Correct

                    dataRecords[x].availableSpaces = dataRecords[x].totalSpaces - dataRecords[x].vehicleCount;

                    const hash = geo.encode(56.153492, 10.214054);
                    dataRecords[x].geoHash = hash;

                    _.merge(dataRecords[x], lonLatDOKK1);
                } else if (dataRecords[x].garageCode === 'Navitas') {
                    const lonLatNavitas = {lat: 56.15886367, lng: 10.215740203}; // Correct

                    dataRecords[x].availableSpaces = dataRecords[x].totalSpaces - dataRecords[x].vehicleCount;

                    const hash = geo.encode(56.15886367, 10.215740203);
                    dataRecords[x].geoHash = hash;

                    _.merge(dataRecords[x], lonLatNavitas);
                } else if (dataRecords[x].garageCode === 'NewBusgadehuset') {
                    const lonLatNewBusgadehuset = {lat: 56.155448, lng: 10.206409}; // Correct

                    dataRecords[x].availableSpaces = dataRecords[x].totalSpaces - dataRecords[x].vehicleCount;


                    const hash = geo.encode(56.155448, 10.206409);
                    dataRecords[x].geoHash = hash;

                    _.merge(dataRecords[x], lonLatNewBusgadehuset);
                } else {
                    console.log(`Hello there i have found ${dataRecords[x].garageCode}garageCode that doesnt have a lat and lng value`);
                }
                dataRecords[x]._id = uuidv4();
                const converDateToIso = dataRecords[x].date;
                dataRecords[x].date = new Date(converDateToIso);
            }

            /*
              else if (dataRecords[counter].garageCode === 'Urban Level 1') {
                  const lonLatUrbanLevel1 = { lat: 56.161148, lng: 10.212163 }; //
                  _.merge(dataRecords[counter], lonLatUrbanLevel1);
                } else if (dataRecords[counter].garageCode === 'Urban Level 2+3') {
                  const lonLatUrbanLevel23 = { lat: 56.161148, lng: 10.212163 }; //
                  _.merge(dataRecords[counter], lonLatUrbanLevel23);
                }
                */

            const dbURL = process.env.DatabaseURL;
            MongoClient.connect(dbURL, {useNewUrlParser: true}, (err, client) => {
                if (err) {
                    console.error(err);
                    process.exit(1);
                }
                const db = client.db('iotcrawler');

                db.collection('parkingSpaces', (collectionErr, collection) => {
                    for (let x = 0; x < dataRecords.length; x += 1) {
                        collection.insert(dataRecords[x]);
                    }
                    if (collectionErr) {
                        console.log(collectionErr);
                    }
                });
                client.close();
                console.log('Collection is closed');
            });
        });
}

const countDown = 10000;
// Run the script
setInterval(goHarvest, countDown);


// Todo - check out how to have a countdown
