admin = db.getSiblingDB("admin");
admin.createUser(
  {
    user: "mongo-admin",
    pwd: "<insert a random password here>",
    roles:
      [
        { role: "root", db: "admin" },
      ],
    mechanisms: ["SCRAM-SHA-256"]
  }
);

admin.auth("mongo-admin", "<insert mongo-admin password from above>");

sh.addShard("mongors1/mongors1n1");
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

sh.shardCollection("iotcrawler.CachedPoint", { pointId: 'hashed' });
sh.shardCollection("iotcrawler.UnlocatedSensor", { location: 'hashed' });
sh.shardCollection("iotcrawler.SensorMetadata", { countryISO: 1, geoPartitionKey: 1 });
