# Deploying indexing component

1. Save `.env.example` file as `indexer.env` and configure the variables appropriately  
  
2. Build docker images

   ```bash
   docker-compose up --build --no-start
   ```

3. Start Mongo DB replica sets
  
   ```bash
   docker-compose start mongors1n1 mongocfg1
   ```

4. Login into a config node and initiate a replica set
  (execute command from `mongodb/scripts/mongors1conf.js` in the mongo shell)  
  
   ```bash  
   docker exec -it indexer-mongocfg1 mongo
   ```  
  
5. Login into a node from each shard and initiate a replica set
  (execute command from `mongodb/scripts/mongors1.js` in the mongo shell)  
  
   ```bash
   docker exec -it indexer-mongors1n1 mongo
   ```  

6. Login into a primary node from each shard and create shard local admin user (execute command from `mongodb/scripts/mongo-AddShardAdmin.js` in the mongo shell)  

   ```bash
   docker exec -it indexer-mongors1n1 mongo
   ```

7. Start Mongo DB router

   ```bash
   docker-compose start mongos1
   ```

8. Login into a router node and configure sharding and authentication (execute command from `mongodb/scripts/mongos.js` in the mongo shell)

   ```bash
   docker exec -it indexer-mongos1 mongo
   ```

9. Populate the Database with geo partitioning data (Country contours)

   ```bash
   docker-compose run --rm indexer node "dist/util/populateFeatureGeometry.js"
   ```

10. Start Indexing service

    ```bash
    docker-compose start indexer
    ```
