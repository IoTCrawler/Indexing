In this code we make geohash:

const hash = geo.encode(lat, long);
dataRecords[x].geoHash = hash

for Indexing:

 collection.createIndex( { geoHash : 1 })

and 1 is for ascending
