# Deploying indexing component

## Detailed process

1. Build docker images
   ```bash
   docker-compose build
   ```
2. Save `.env.example` file as `indexer.env` and configure the variables appropriately
3. Create docker containers
   ```bash
   docker-compose up --no-start
   ```
4. Start Mongo DB replica sets
   ```bash
   docker-compose start mongors1n1 mongocfg1
   ```
5. Login into a config node and initiate a replica set
  (execute command from [mongors1conf1.js](./mongodb/scripts/mongors1conf1.js) in the mongo shell)
  ```bash
  docker-compose exec -T mongocfg1 mongo < mongodb/scripts/mongors1conf1.js
  ```
6. Login into a node from each shard and initiate a replica set
  (execute command from [mongors1.js](./mongodb/scripts/mongors1.js) in the mongo shell)
  ```bash
  docker-compose exec -T mongors1n1 mongo < mongodb/scripts/mongors1.js
  ```
7. Login into a primary node from each shard and create shard local admin user
  (execute command from [mongo-AddShardAdmin.js](./mongodb/scripts/mongo-AddShardAdmin.js) in the mongo shell)
  ```bash
  docker-compose exec -T mongors1n1 mongo < mongodb/scripts/mongo-AddShardAdmin.js
  ```
8. Start Mongo DB router
   ```bash
   docker-compose start mongos1
   ```
9. Login into a router node and configure sharding and authentication
  (execute command from [mongos.js](./mongodb/scripts/mongos.js) in the mongo shell)
  ```bash
  docker-compose exec -T mongos1 mongo < mongodb/scripts/mongos.js
  ```
10. Populate the Database with geo partitioning data (Country contours)
    ```bash
    docker-compose run --rm indexer node "dist/util/populateFeatureGeometry.js"
    ```
11. Start Indexing service
    ```bash
    docker-compose start indexer
    ```

## Broker subscription

As a last step, the indexer must subscribe to the MDR, in order to receive notifications from the streams and points to be indexed. This has to be done through the provided indexer REST API, and for this example, it could be done with the following command:

```bash
curl -X POST \
  http://localhost:8083/api/broker \
  -H 'Content-Type: application/json' \
  -d '{
    "host": "https://pepproxy:1027"
}'
```


## All together

You can run the [deploy.sh script](./deploy.sh) from this same folder, or copy-paste the following commands straight to the command line, again from this same folder.

```bash
docker-compose build
docker-compose up --no-start
docker-compose start mongors1n1 mongocfg1

sleep 3

docker-compose exec -T mongocfg1 mongo < mongodb/scripts/mongors1conf1.js
docker-compose exec -T mongors1n1 mongo < mongodb/scripts/mongors1.js

sleep 3

docker-compose exec -T mongors1n1 mongo < mongodb/scripts/mongo-AddShardAdmin.js

docker-compose start mongos1

sleep 3

docker-compose exec -T mongos1 mongo < mongodb/scripts/mongos.js

docker-compose run --rm indexer node "dist/util/populateFeatureGeometry.js"

docker-compose start indexer

curl -X POST \
  http://localhost:8083/api/broker \
  -H 'Content-Type: application/json' \
  -d '{
    "host": "https://pepproxy:1027"
}'

```

## Final notes, tips and tricks

**NOTE:** *trap for young players*! make sure to delete previous volumes that could have been left on previous runs, don't rely solely on `docker-compose rm -fsv` to delete everything, as sometimes volumes can be left behind.
