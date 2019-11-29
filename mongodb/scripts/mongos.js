admin = db.getSiblingDB("admin");
admin.createUser(
  {
    user: "mongo-admin",
    pwd: "<insert a random admin password here>",
    roles:
      [
        { role: "root", db: "admin" },
      ],
    mechanisms: ["SCRAM-SHA-256"]
  }
);

admin.auth("mongo-admin", "<insert a random admin password here>");

sh.addShard("mongors1/indexer-mongors1n1");
sh.enableSharding("iotcrawler");

iotcrawler = db.getSiblingDB("iotcrawler");
iotcrawler.createUser(
  {
    user: "iotcrawler",
    pwd: "<insert a random password here>",
    roles:
      [
        { role: "readWrite", db: "iotcrawler" },
      ],
    mechanisms: ["SCRAM-SHA-256"]
  }
);

sh.shardCollection("iotcrawler.PointMapping", { _id: 'hashed' });
sh.shardCollection("iotcrawler.QoiMapping", { _id: 'hashed' });
sh.shardCollection("iotcrawler.StreamMapping", { _id: 'hashed' });
sh.shardCollection("iotcrawler.SensorMapping", { _id: 'hashed' });
sh.shardCollection("iotcrawler.UnlocatedIotStream", { _id: 'hashed' });
sh.shardCollection("iotcrawler.UnmatchedPoint", { _id: 'hashed' });
sh.shardCollection("iotcrawler.UnmatchedQuality", { _id: 'hashed' });
sh.shardCollection("iotcrawler.UnmatchedSensor", { _id: 'hashed' });

sh.shardCollection("iotcrawler.IndexedIotStream", { countryISO: 1, geoPartitionKey: 1 });
