admin = db.getSiblingDB("admin");
admin.createUser(
  {
    user: "mongo-admin",
    pwd: "xrg1`cke1x8Xi8J",
    roles:
      [
        { role: "root", db: "admin" },
      ],
    mechanisms: ["SCRAM-SHA-256"]
  }
);

admin.auth("mongo-admin", "xrg1`cke1x8Xi8J");

sh.addShard("mongors1/indexer-mongors1n1");
sh.enableSharding("iotcrawler");

iotcrawler = db.getSiblingDB("iotcrawler");
iotcrawler.createUser(
  {
    user: "iotcrawler",
    pwd: "xrg1`cke1x8Xi8J",
    roles:
      [
        { role: "readWrite", db: "iotcrawler" },
      ],
    mechanisms: ["SCRAM-SHA-256"]
  }
);

sh.shardCollection("iotcrawler.CachedPoint", { pointId: 'hashed' });
sh.shardCollection("iotcrawler.UnlocatedSensor", { location: 'hashed' });
sh.shardCollection("iotcrawler.SensorMetadata", { countryISO: 1, geoPartitionKey: 1 });
