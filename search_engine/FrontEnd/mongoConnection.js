const MongoConnection = require('mongodb').MongoClient;

const dbURL = process.env.DatabaseURL;

let _db = null; // global variable to hold the connection

module.exports = {

    connectToServer(callback) {
        MongoConnection.connect(dbURL, { useNewUrlParser: true }, (err, db) => {
            _db = db;
            return callback(err);
        });
    },

    getDb() {
        return _db;
    },
};
