# Indexing component of IoT Crawler

Indexing is a Node.js web service written in TypeScript. It uses sharded MongoDB to store its data.
It subscribes to the broker for Stream, Sensor, QoI and Location changes and uses these notifications to keep index up-to-date.

It exposes full NGSI-LD querying interface. `Link` header or *Temporal Entities* are **NOT** supported.
If query is too complex (contains RegExp), involes entities (or related entities) or properties which are not part of the index,
it will be forwared to NGSI-LD broker.

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
```jsonnet
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
```jsonnet
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
```jsonnet
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
```jsonnet
DELETE /api/broker/:id
```
**Description**

Removes broker registration from the indexer. The indexer in turn makes a request to broker to delete the corresponding subscription.
The response is a 204.

### Notification handling
#### Add Stream to Index
```jsonnet
POST /api/notification/stream
```
**Description**

Adds the stream fron the request to the Index. This API is intended to be used as a callback for the broker.

**Request**
```json
{
    "subscriptionId": "5d7223f457102222dce6f40b",
    "data": [
        {
            "id": "urn:ngsi-ld:Stream:stream1",
            "type": "http://purl.org/iot/ontology/iot-stream#IotStream",
            "http://purl.org/iot/ontology/iot-stream#generatedBy": {
            	"type": "Relationship",
            	"object": "urn:ngsi-ld:Sensor:sensor1"
            },
            "https://w3id.org/iot/qoi#hasQuality": {
            	"type": "Relationship",
            	"object": "urn:ngsi-ld:Quality:qoi1"
            }
        }
    ]
}
```

**Response**
```json
{}
```

#### Add Sensor to Index
```jsonnet
POST /api/notification/sensor
```
**Description**

Adds the Sensor from the request to the Index. This API is intended to be used as a callback for the broker.

**Request**
```json
{
    "subscriptionId": "5d7223f457102222dce6f40b",
    "data": [
        {
            "id": "urn:ngsi-ld:Sensor:sensor1",
            "type": "http://www.w3.org/ns/sosa/Sensor",
            "location": {
                "type": "GeoProperty",
                "value": {
                    "type": "Point",
                    "coordinates": [
                        -3.803561677,
                        43.462966417
                    ]
                }
            },
            "http://www.w3.org/2003/01/geo/wgs84_pos#location": {
                "type": "Relationship",
                "object": "urn:ngsi-ld:Point:point1"
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

#### Add QoI to Index
```jsonnet
POST /api/notification/qoi
```
**Description**

Adds the QoI from the request to the Index. This API is intended to be used as a callback for the broker.
All properties of the entity will be added to the index as is.

**Request**
```json
{
    "subscriptionId": "5d7223f457102222dce6f40b",
    "data": [
        {
            "id": "urn:ngsi-ld:Quality:qoi1",
            "type": "https://w3id.org/iot/qoi#Quality",
            "https://w3id.org/iot/qoi#prop1": {
            	"type": "Relationship",
            	"object": "urn:ngsi-ld:qoiProp:p1"
            },
            "https://w3id.org/iot/qoi#prop2": {
            	"type": "Property",
            	"value": 0.86
            }
        }
    ]
}
```

**Response**
```json
{}
```

#### Add Point to Index
```jsonnet
POST /api/notification/point
```
**Description**

Adds the Point from the request to the Index. This API is intended to be used as a callback for the broker.

**Request**
```json
{
    "subscriptionId": "5d7223f457102222dce6f40b",
    "data": [
        {
            "id": "urn:ngsi-ld:Point:point1",
            "type": "http://www.w3.org/2003/01/geo/wgs84_pos#Point",
            "http://purl.oclc.org/NET/UNIS/fiware/iot-lite#relativeLocation": {
            	"type": "Property",
            	"value": "This is my location description"
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
```jsonnet
GET /ngsi-ld/v1/entities
```
**Description**

Indexing implements full NGSI-LD qurying interface. `Link` header is **NOT** supported.
Response will always contain fully expanded URL for properties.

In queries compact property names can be used. Indexing will use the following context to expand them.
Keep in mind these will only be expanded when querying the index. 
If query is too complex or queried entites are not in the index, original requst will be forwarded to NGSI-LD Broker as is.

```json
{
    "@context": {
        "Point": "Point",
        "Sensor": "http://www.w3.org/ns/sosa/Sensor",
        "IotStream": "http://purl.org/iot/ontology/iot-stream#IotStream",
        "Quality": "https://w3id.org/iot/qoi#Quality",
        "relativeLocation": "http://purl.oclc.org/NET/UNIS/fiware/iot-lite#relativeLocation",
        "metaLocation": {
            "@type": "@id",
            "@id": "http://www.w3.org/2003/01/geo/wgs84_pos#location"
        },
        "observes": {
            "@type": "@id",
            "@id": "http://www.w3.org/ns/sosa/observes"
        },
        "generatedBy": {
            "@type": "@id",
            "@id": "http://purl.org/iot/ontology/iot-stream#generatedBy"
        },
        "hasQuality": {
            "@type": "@id",
            "@id": "https://w3id.org/iot/qoi#hasQuality"
        }
    }
}
```

**Examples**
```jsonnet
// IotStream
GET /ngsi-ld/v1/entities?idPattern=.*&type=iot-stream:IotStream&q=iot-stream:generatedBy.geo:location.iot-lite:relativeLocation=="This is my location description";qoi:hasQuality.https://w3id.org/iot/qoi%23prop2>0.7
GET /ngsi-ld/v1/entities?type=http://purl.org/iot/ontology/iot-stream%23IotStream&q=http://purl.org/iot/ontology/iot-stream%23generatedBy==urn:ngsi-ld:Sensor:aarhus:traffic:192627:avgMeasuredTime|http://purl.org/iot/ontology/iot-stream%23generatedBy==urn:ngsi-ld:Sensor:aarhus:traffic:192627:avgSpeed

// Sensor
GET /ngsi-ld/v1/entities?georel=near;maxDistance==100000&geometry=Point&coordinates=[-4.0,43.5]&type=sosa:Sensor&q=geo:location.iot-lite:relativeLocation=="This is my location description"
GET /ngsi-ld/v1/entities?type=http://www.w3.org/ns/sosa/Sensor&georel=near;maxDistance==4500&geometry=Point&coordinates=[10.2,56.16]&q=http://www.w3.org/ns/sosa/observes==urn:ngsi-ld:ObservableProperty:aarhus:traffic:avgMeasuredTime|http://www.w3.org/ns/sosa/observes==urn:ngsi-ld:ObservableProperty:aarhus:traffic:avgSpeed

// QoI
GET /ngsi-ld/v1/entities?id=urn:ngsi-ld:Quality:qoi1&type=qoi:Quality&q=https://w3id.org/iot/qoi%23prop2>0.7

// Point
GET /ngsi-ld/v1/entities?id=urn:ngsi-ld:Point:point1&type=geo:Point&q=iot-lite:relativeLocation=="This is my location description"
```

The following queries are supported, but will be forwarded to NGSI-LD broker:
```jsonnet
// Stream Observations
GET /ngsi-ld/v1/entities/?type=http%3A%2F%2Fpurl.org%2Fiot%2Fontology%2Fiot-stream%23StreamObservation&q=http://www.w3.org/ns/sosa/resultTime>"2019-11-27T11:30:00.000Z"
GET /ngsi-ld/v1/entities?type=http%3A%2F%2Fpurl.org%2Fiot%2Fontology%2Fiot-stream%23StreamObservation&q=http%3A%2F%2Fpurl.org%2Fiot%2Fontology%2Fiot-stream%23belongsTo%3D%3Durn%3Angsi-ld%3AIotStream%3Aaarhus%3Atraffic%3A192627%3AavgMeasuredTime%7Chttp%3A%2F%2Fpurl.org%2Fiot%2Fontology%2Fiot-stream%23belongsTo%3D%3Durn%3Angsi-ld%3AIotStream%3Aaarhus%3Atraffic%3A192627%3AavgSpeed&limit=500

// Events
GET /ngsi-ld/v1/entities?type=http://purl.org/iot/ontology/iot-stream%23Event&q=http://purl.org/iot/ontology/iot-stream%23generatedBy==urn:ngsi-ld:Sensor:aarhus:traffic:192627:avgMeasuredTime|http://purl.org/iot/ontology/iot-stream%23generatedBy==urn:ngsi-ld:Sensor:aarhus:traffic:192627:avgSpeed
```

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
