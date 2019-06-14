const Geohash = require('latlon-geohash');

const lat = 56.150461;
const lng = 10.201091;


const neighboursObj = Geohash.encode(lat, lng, [6]);
const neighboursObj2 = Geohash.neighbours(neighboursObj);
const neighboursArr = Object.keys(neighboursObj2).map(n => neighboursObj2[n]);

console.log(neighboursObj);
console.log(neighboursArr);

if (neighboursObj.substr(0 , 5).includes('u1zr2')) {
    console.log('found one');
}


/*

    "lat" : 56.150461,
    "lng" : 10.201091,
    "geoHash" : "u1zr2juhnssf"

* */

const age = 26;
const canDrinkAlcohol = (age > 21) ? 'True, over 21' : 'False, under 21';
console.log(canDrinkAlcohol); // "True, over 21"
