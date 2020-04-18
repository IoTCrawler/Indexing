rs.initiate({
    _id: "mongors1conf",
    configsvr: true,
    members: [
        {_id:0,host:"indexer-mongocfg1-0.indexer-mongocfg1.default.svc.cluster.local:27017"},
        {_id:1,host: "indexer-mongocfg1-1.indexer-mongocfg1.default.svc.cluster.local:27017"},
        {_id:2,host: "indexer-mongocfg1-2.indexer-mongocfg1.default.svc.cluster.local:27017"}
    ]
});