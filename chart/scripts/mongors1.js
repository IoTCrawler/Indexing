rs.initiate({
    _id: "mongors1",
    members: [
      {_id:0,host:"indexer-mongors1n1-0.indexer-mongors1n1.indexing-9-production.svc.cluster.local:27017"},
      {_id:1,host:"indexer-mongors1n1-1.indexer-mongors1n1.indexing-9-production.svc.cluster.local:27017"},
      {_id:2,host:"indexer-mongors1n1-2.indexer-mongors1n1.indexing-9-production.svc.cluster.local:27017"}
    ]
});
admin = db.getSiblingDB("admin");
admin.createUser(
    {
        user: "mongors1-admin",
        pwd: "qweasd",
        roles:
            [
                { role: "userAdminAnyDatabase", db: "admin" },
                { role: "clusterAdmin", db: "admin" }
            ],
        mechanisms: [ "SCRAM-SHA-256" ]
    }
);
