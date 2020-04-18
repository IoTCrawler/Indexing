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
if [ $TYPE = "config" ]
then
  echo "starting mongodb config"
  if [[ $HOSTNAME = "indexer-mongocfg1-2" ]]; then
    echo "Setting node as primary"
    mongod  --configsvr --replSet mongors1conf --dbpath /data/db --port 27017  --bind_ip 0.0.0.0 2>&1 | tee -a /var/log/mongodb.log 1>&2 &
    retry_until
    mongo < /home/scripts/mongors1conf1.js
    echo "execute script"
    while true; do
      :
    done
  else
    echo "Setting node as secondary"
    mongod  --configsvr --replSet mongors1conf --dbpath /data/db --port 27017  --bind_ip 0.0.0.0
  fi
  
elif [ $TYPE = "shard" ]
then
  echo "starting mongodb shard"
  if [[ $HOSTNAME = "indexer-mongors1n1-2" ]]; then
    echo "Setting node as primary"
    mongod  --shardsvr --replSet mongors1 --dbpath /data/db --port 27017 --bind_ip 0.0.0.0 2>&1 | tee -a /var/log/mongodb.log 1>&2 &
    retry_until
    echo "execute script"
    mongo < /home/scripts/mongors1.js
    while true; do
      :
    done
  else
    info "Setting node as secondary"
    mongod  --shardsvr --replSet mongors1 --dbpath /data/db --port 27017 --bind_ip 0.0.0.0
  fi


elif [ $TYPE = "mongos" ]
then
  echo "starting mongos"
  mongos  --configdb mongors1conf/indexer-mongocfg1:27017 --port 27017 --bind_ip 0.0.0.0 2>&1 | tee -a /var/log/mongodb.log 1>&2 &
  retry_until
  echo "execute scripts"
  mongo < /home/scripts/mongos.js
  while true; do
    :
  done
else
  echo "wrong option"
fi