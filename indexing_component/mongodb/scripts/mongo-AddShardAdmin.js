admin = db.getSiblingDB("admin");
admin.createUser(
    {
        user: "mongors1-admin",
        pwd: "xrg1`cke1x8Xi8J",
        roles:
            [
                { role: "userAdminAnyDatabase", db: "admin" },
                { role: "clusterAdmin", db: "admin" }
            ],
        mechanisms: [ "SCRAM-SHA-256" ]
    }
);
