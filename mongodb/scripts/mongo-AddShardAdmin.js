admin = db.getSiblingDB("admin");
admin.createUser(
    {
        user: "mongors1-admin",
        pwd: "<insert a random admin password here>",
        roles:
            [
                { role: "userAdminAnyDatabase", db: "admin" },
                { role: "clusterAdmin", db: "admin" }
            ],
        mechanisms: [ "SCRAM-SHA-256" ]
    }
);
