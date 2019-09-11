admin = db.getSiblingDB("admin");
admin.createUser(
    {
      user: "mongo-admin",
      pwd: "<insert a random password here>",
      roles: 
        [ 
          { role: "root", db: "admin" },
        ],
        mechanisms: [ "SCRAM-SHA-256" ]
    }
);

admin.auth("mongo-admin", "adminpwd");

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
        mechanisms: [ "SCRAM-SHA-256" ]
    }
);
