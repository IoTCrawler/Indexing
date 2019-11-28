rs.initiate({
    _id: "mongors1conf",
    configsvr: true,
    members: [
        { _id: 0, host: "indexer-mongocfg1" }
    ]
});