#!/bin/bash
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

sleep 3

curl -X POST \
  http://localhost:8083/api/broker \
  -H 'Content-Type: application/json' \
  -d '{
    "host": "https://pepproxy:1027"
}'
