#!/bin/bash
TYPE=$1
retry_until() {
  COUNTER=0
  grep -q 'waiting for connections on port' /var/log/mongodb.log
  while [[ $? -ne 0 ]] ; do
      sleep 2
      let COUNTER+=2
      echo "Waiting for server to initialize... $COUNTER"
      grep -q 'waiting for connections on port' /var/log/mongodb.log
  done
}

echo $KEYFILE >> /home/keyfile
chown mongodb:mongodb /home/keyfile
chmod 400 /home/keyfile
echo 'Europe/London' > /etc/localtime
chmod 444 /etc/localtime
if [ $TYPE = "cfg1" ]
then
  echo "starting mongodb config"
  # Perform adaptations depending on the host name
  if [[ $HOSTNAME = "indexer-mongocfg1-2" ]]; then
    echo "Setting node as primary"
    mongod  --configsvr --replSet mongors1conf --dbpath /data/db --port 27017  --bind_ip 0.0.0.0 2>&1 | tee -a /var/log/mongodb.log 1>&2 &
    retry_until
    mongo --eval 'rs.initiate({_id:"mongors1conf",configsvr:true,members:[{_id:0,host:"indexer-mongocfg1-0.indexer-mongocfg1.default.svc.cluster.local:27017"},{_id:1,host: "indexer-mongocfg1-1.indexer-mongocfg1.default.svc.cluster.local:27017"},{_id:2,host: "indexer-mongocfg1-2.indexer-mongocfg1.default.svc.cluster.local:27017"}]})'
    #mongo --eval 'rs.add({_id:1,host: "indexer-mongocfg1-1.indexer-mongocfg1.default.svc.cluster.local:27017"})'
    #mongo --eval 'rs.add({_id:2,host: "indexer-mongocfg1-2.indexer-mongocfg1.default.svc.cluster.local:27017"})'
    mongo --eval 'db.getSiblingDB("admin").createUser({user:"mongors1conf-admin",pwd: "qweasd",roles:[{role:"userAdminAnyDatabase",db:"admin" },{role:"clusterAdmin",db:"admin"}],mechanisms:["SCRAM-SHA-256"]})'
    
    while true; do
      :
    done
  else
    echo "Setting node as secondary"
    mongod  --configsvr --replSet mongors1conf --dbpath /data/db --port 27017  --bind_ip 0.0.0.0
  fi
  
elif [ $TYPE = "rs1n1" ]
then
  echo "starting mongodb shard"
  if [[ $HOSTNAME = "indexer-mongors1n1-2" ]]; then
    echo "Setting node as primary"
    mongod  --shardsvr --replSet mongors1 --dbpath /data/db --port 27017 --bind_ip 0.0.0.0 2>&1 | tee -a /var/log/mongodb.log 1>&2 &
    retry_until
    mongo --eval 'rs.initiate({_id:"mongors1",members:[{_id:0,host:"indexer-mongors1n1-0.indexer-mongors1n1.default.svc.cluster.local:27017"},{_id:1,host:"indexer-mongors1n1-1.indexer-mongors1n1.default.svc.cluster.local:27017"},{_id:2,host:"indexer-mongors1n1-2.indexer-mongors1n1.default.svc.cluster.local:27017"}]})'
    mongo --eval 'db.getSiblingDB("admin").createUser({user:"mongors1-admin",pwd: "qweasd",roles:[{role:"userAdminAnyDatabase",db:"admin" },{role:"clusterAdmin",db:"admin"}],mechanisms:["SCRAM-SHA-256"]})'
    while true; do
      :
    done
  else
    info "Setting node as secondary"
    mongod  --shardsvr --replSet mongors1 --dbpath /data/db --port 27017 --bind_ip 0.0.0.0
  fi


elif [ $TYPE = "s1" ]
then
  echo "starting mongos"
  mongos  --configdb mongors1conf/indexer-mongocfg1:27017 --port 27017 --bind_ip 0.0.0.0 2>&1 | tee -a /var/log/mongodb.log 1>&2 &
  retry_until
  mongo --eval 'db.getSiblingDB("admin").createUser({user:"mongo-admin",pwd:"qweasd",roles:[{role:"root",db:"admin"},],mechanisms:["SCRAM-SHA-256"]})'
  mongo --eval 'db.getSiblingDB("admin").auth("mongo-admin", "qweasd")'
  mongo --eval 'sh.addShard("mongors1/indexer-mongors1n1-2.indexer-mongors1n1.default.svc.cluster.local:27017")'
  mongo --eval 'sh.addShard("mongors1/indexer-mongors1n1-1.indexer-mongors1n1.default.svc.cluster.local:27017")'
  mongo --eval 'sh.addShard("mongors1/indexer-mongors1n1-0.indexer-mongors1n1.default.svc.cluster.local:27017")'
  mongo --eval 'sh.enableSharding("iotcrawler")'
  mongo --eval 'db.getSiblingDB("iotcrawler").createUser({user:"iotcrawler",pwd:"qweasdf",roles:[{role:"readWrite",db:"iotcrawler"},],mechanisms:["SCRAM-SHA-256"]})'

  mongo --eval 'sh.shardCollection("iotcrawler.PointMapping",{_id:"hashed"})'
  mongo --eval 'sh.shardCollection("iotcrawler.QoiMapping",{_id:"hashed"})'
  mongo --eval 'sh.shardCollection("iotcrawler.StreamMapping",{_id:"hashed"})'
  mongo --eval 'sh.shardCollection("iotcrawler.SensorMapping",{_id:"hashed"})'
  mongo --eval 'sh.shardCollection("iotcrawler.UnlocatedIotStream",{_id:"hashed"})'
  mongo --eval 'sh.shardCollection("iotcrawler.UnmatchedPoint",{_id:"hashed"})'
  mongo --eval 'sh.shardCollection("iotcrawler.UnmatchedQuality",{_id:"hashed"})'
  mongo --eval 'sh.shardCollection("iotcrawler.UnmatchedSensor",{_id:"hashed"})'
  mongo --eval 'sh.shardCollection("iotcrawler.IndexedIotStream",{countryISO:1,geoPartitionKey:1})'
  while true; do
    :
  done
else
  echo "wrong option"
fi
exit 0


# rs.reconfig({_id:"mongors1conf",configsvr:true,members:[{_id:0,host:"indexer-mongocfg1-0:27017"},{_id:1,host:"indexer-mongocfg1-1:27017"}]})
# rs.add({host:"replica-mongodb-replicaset-1.replica-mongodb-replicaset.default.svc.cluster.local:27017"})

#  rs.add({_id:1,host: "indexer-mongocfg1-1.indexer-mongocfg1.default.svc.cluster.local:27017"})
# mongors1/
# {_id:0,host:"indexer-mongors1n1-0.indexer-mongors1n1.default.svc.cluster.local:27017"}