# Mongo DB setup example
This folder containts some example scripts to setup a sharded mongo DB using docker-compose.

## Running
```cmd
docker-compose up
```

## First time setup
1. Generate a keyfile:
  ```cmd
  openssl rand -base64 756 > /path/to/keyfile
  ```
2. Create a `mongodb-security` volume and copy your keyfile to the root of the volume.
3. Login into mongodb instance using bash and change permissions on the keyfile
  (make sure to remove readonly attirbute from the volume mount)
   ```cmd
   docker exec -it mongors1n1 bash
   chown mongodb:mongodb /security/keyfile
   chmod 400 /security/keyfile
   ```
4. Login into a config node and initiate a replica set
  (execute command from `mongors1conf.js` in the mongo shell)
  ```cmd
  docker exec -it mongocfg1 mongo
  ```
5. Login into a node from each shard and initiate a replica set
  (execute command from `mongors1.js` in the mongo shell)
  ```cmd
  docker exec -it mongors1n1 mongo
  ```
6. Login into a primary node from each shard and create shard local admin user
  (execute command from `mongo-AddShardAdmin.js` in the mongo shell)
  ```cmd
  docker exec -it mongors1n1 mongo
  ```
7. Login into a router node and configure sharding and authentication
  (execute command from `mongos.js` in the mongo shell)
  ```cmd
  docker exec -it mongos1 mongo
  ```
