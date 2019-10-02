# Indexing component of IoT Crawler

Indexing is a Node.js web service written in TypeScript. It uses sharded MongoDB to store its data.
It subscribes to the broker for Sensor and Location changes and uses these notifications to keep index up-to-date.

It exposes a query API which suppors 2 types of queries. Both queries have sorted and unsorted variants.
Sorted variant sorts the results by distance from the centre and includes this distance as an output property.
Additionally additional attributes (currently only `type`) can be included in the query.
- Get all sensors within a rectangle (defined by 4 geo points) [`$geoWithin`]
- Get all sensors within a radius from a point [`$near`]

## API
### Common Error response
```json
{
    "status": 404,
    "message": "Broker registration with id='5d7223f48484ea3f3cd605bb' does not exist"
}
```

### Broker Management
#### List registered brokers
```http
GET /api/broker
```
**Description**

Returns a list of registered brokers.

**Response**
```json
{
    "count": 2,
    "result": [
        {
            "_id": "5d7223f48484ea3f3cd605bb",
            "host": "http://broker.iotcrawler.net",
            "subscriptionId": "5d7926fb6218616932949fa4"
        },
        {
            "_id": "5d79270db817cb5f0e401443",
            "host": "http://broker2.iotcrawler.net",
            "subscriptionId": "5d792711f38f3f53d4a7aa98"
        }
    ]
}
```

#### Retrieve broker registration
```http
GET /api/broker/:id
```
**Description**

Returns a registered broker.

**Response**
```json
{
    "_id": "5d79270db817cb5f0e401443",
    "host": "http://broker2.iotcrawler.net",
    "subscriptionId": "5d792711f38f3f53d4a7aa98"
}
```

#### Register a new broker
```http
POST /api/broker
```
**Description**

Registeres a new broker with the indexer. The indexer in turn makes a request to broker to subscribe to sensors and their properties.
Currently indexer only subscribes to location and type of the sensor.

**Request**
```json
{
    "host": "http://broker2.iotcrawler.net"
}
```

**Response**
`Location: /api/broker/5d79270db817cb5f0e401443`
```json
{
    "_id": "5d79270db817cb5f0e401443",
    "host": "http://broker2.iotcrawler.net",
    "subscriptionId": "5d792711f38f3f53d4a7aa98"
}
```

#### Remove broker registration
```http
DELETE /api/broker/:id
```
**Description**

Removes broker registration from the indexer. The indexer in turn makes a request to broker to delete the corresponding subscription.
The response is a 204.

### Notification handling
```http
POST /api/notification
```
**Description**

Updates the index according to content of the request. This API is intended to be used as a callback for the broker.


**Request**
```json
{
    "subscriptionId": "5d7223f457102222dce6f40b",
    "data": [
        {
            "id": "urn:ngsi-ld:Point:demoLocation1",
            "type": "http://www.w3.org/2003/01/geo/wgs84_pos#Point",
            "location": {
                "type": "GeoProperty",
                "value": "{\"type\": \"Point\",\"coordinates\": [-3.803561677,43.462966417]}"
            }
        },
        {
            "id": "urn:ngsi-ld:Sensor:demoSensor1",
            "type": "http://www.w3.org/ns/sosa/Sensor",
            "http://www.w3.org/2003/01/geo/wgs84_pos#location": {
                "type": "Relationship",
                "object": "urn:ngsi-ld:Point:demoLocation1"
            },
            "http://www.w3.org/ns/sosa/observes": {
                "type": "Relationship",
                "object": "urn:ngsi-ld:ObservableProperty:temperature"
            }
        }
    ]
}
```

**Response**
```json
{}
```


### Querying
```http
GET /api/query
```

**Description**

Returns a list of sensors in the requested location matching the specified criteria.
Querying criteria should be specified as part of the URL according to the specification below.

#### Query for sensors within a rectangle
| Query parameter | Required | Description |
| ------ | ------ | ------ |
| location[query] | yes | Must be equal to `$geoWithin` |
| location[coordinates][0][0] | yes | Longitude of the first corner of the rectangle |
| location[coordinates][0][1] | yes | Latitude of the first corner of the rectangle |
| location[coordinates][1][0] | yes | Longitude of the next corner of the rectangle (CCW) |
| location[coordinates][1][1] | yes | Latitude of the next corner of the rectangle (CCW) |
| location[coordinates][2][0] | yes | Longitude of the next corner of the rectangle (CCW) |
| location[coordinates][2][1] | yes | Latitude of the next corner of the rectangle (CCW) |
| location[coordinates][3][0] | yes | Longitude of the last corner of the rectangle (CCW) |
| location[coordinates][3][1] | yes | Latitude of the last corner of the rectangle (CCW) |
| location[sort] | no | A boolean flag whether to sort the results by distance from center. The calculated distance is included in the result. Default: `false`  |
| type | no | Sensor type (e.g. temperature) |


**Example**
```http
GET /api/query
    ?location[query]=$geoWithin
    &location[coordinates][0][0]=0.000000
    &location[coordinates][0][1]=0.000000
    &location[coordinates][1][0]=0.000000
    &location[coordinates][1][1]=20.000000
    &location[coordinates][2][0]=15.000000
    &location[coordinates][2][1]=20.000000
    &location[coordinates][3][0]=15.000000
    &location[coordinates][3][1]=0.000000
    &type=temperature
```

**Response**
```json
[
    {
        "id": "urn:ngsi-ld:Sensor:demoSensor1",
        "http://www.w3.org/ns/sosa/observes": "urn:ngsi-ld:ObservableProperty:temperature",
        "location": {
            "type": "Point",
            "coordinates": [
                3.803561677,
                18.462966417
            ]
        }
    },
    {
        "id": "urn:ngsi-ld:Sensor:demoSensor2",
        "http://www.w3.org/ns/sosa/observes": "urn:ngsi-ld:ObservableProperty:temperature",
        "location": {
            "type": "Point",
            "coordinates": [
                7.803561677,
                5.462966417
            ]
        }
    }
]
```

#### Querying for sensors near a Point
| Query parameter | Required | Description |
| ------ | ------ | ------ |
| location[query] | yes | Must be equal to `$near` |
| location[point][0] | yes | Longitude of the first corner of the rectangle |
| location[point][1] | yes | Latitude of the first corner of the rectangle |
| location[maxDistance] | if `sort` is `false` | The radius of a circle in meters to limit results to |
| location[sort] | no | A boolean flag whether to sort the results by distance from center. The calculated distance is included in the result. Default: `true`  |
| type | no | Sensor type (e.g. temperature) |

***Note:*** *If `maxDistance` is not specified the top 100 sensors will be returned.*

**Example**
```http
GET /api/query
    ?location[query]=$near
    &location[coordinates][0][0]=0.000000
    &location[coordinates][0][1]=0.000000
    &location[maxDistance]=48000.000
    &type=temperature
```

**Response**
```json
[
    {
        "id": "urn:ngsi-ld:Sensor:demoSensor1",
        "http://www.w3.org/ns/sosa/observes": "urn:ngsi-ld:ObservableProperty:temperature",
        "location": {
            "type": "Point",
            "coordinates": [
                3.803561677,
                6.462966417
            ]
        },
        "distance": 36156.15467
    },
    {
        "id": "urn:ngsi-ld:Sensor:demoSensor2",
        "http://www.w3.org/ns/sosa/observes": "urn:ngsi-ld:ObservableProperty:temperature",
        "location": {
            "type": "Point",
            "coordinates": [
                7.803561677,
                5.462966417
            ]
        },
        "distance": 47498.1358
    }
]
```

***Note:*** *This query will only return results in the same Country (geo partition) as the original point.*

## Running the service

```bash
npm run dev
```

### Running in Production mode

1. Build the service
   ```bash
   npm run build
   ```
2. Start the service
   ```bash
   npm run start
   ```

**Alternative**
To run the service inside a container follow the instructions in [DEPLOYMENT.md](./DEPLOYMENT.md).

### First time setup

1. Install dependencies
   ```bash
   npm install
   ```
2. Setup and Start mongo
   MongoDB setup instructions are located in: [DEPLOYMENT.md](./DEPLOYMENT.md).
3. Create a `.env` file (copy from `.env.example`) and set the variables appropriately
4. Add country boundary data to the database
   ```bash
   npm run populateDB
   ```
