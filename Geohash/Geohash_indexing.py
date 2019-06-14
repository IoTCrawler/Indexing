import pygeohash as gh
from pymongo import MongoClient
from sshtunnel import SSHTunnelForwarder


MONGO_HOST = ""
MONGO_DB = ""
MONGO_USER = ""
MONGO_PASS = ""
COLLECTION_NAME = ""
LOCAL_HOST = "127.0.0.1"
MONGO_PORT = 27000

MONGO_details = {'LOCAL_HOST': LOCAL_HOST,
                 'MONGO_HOST': MONGO_HOST,
                 'MONGO_DB': MONGO_DB,
                 'MONGO_USER': MONGO_USER,
                 'MONGO_PASS': MONGO_PASS,
                 'MONGO_PORT': MONGO_PORT,
                 'COLLECTION_NAME': COLLECTION_NAME}


def get_geohash(server_details, object='attrs'):
    server = SSHTunnelForwarder(
        server_details['MONGO_HOST'],
        ssh_username=server_details['MONGO_USER'],
        ssh_password=server_details['MONGO_PASS'],
        remote_bind_address=(server_details['LOCAL_HOST'], server_details['MONGO_PORT'])
    )

    server.start()
    client = MongoClient(server_details['LOCAL_HOST'], server.local_bind_port)
    db = client[server_details['MONGO_DB']]
    collection = db[server_details['COLLECTION_NAME']]

    geohash = []
    for item in collection.find():
        if item['_id']['type'] == "Point":
            long = item[object]['long']['value']
            lat = item[object]['lat']['value']
            hash = gh.encode(latitude=lat, longitude=long)
            geohash.append(hash)

    server.stop()
    return geohash


def update_dataset_geohash(server_details, object):
    server = SSHTunnelForwarder(
        server_details['MONGO_HOST'],
        ssh_username=server_details['MONGO_USER'],
        ssh_password=server_details['MONGO_PASS'],
        remote_bind_address=(server_details['LOCAL_HOST'], server_details['MONGO_PORT'])
    )

    server.start()
    client = MongoClient(server_details['LOCAL_HOST'], server.local_bind_port)
    db = client[server_details['MONGO_DB']]
    collection = db[server_details['COLLECTION_NAME']]

    for item in collection.find():
        if item['_id']['type'] == "Point":
            long = item[object]['long']['value']
            lat = item[object]['lat']['value']
            hash = gh.encode(latitude=lat, longitude=long)
            item[object]['geohash'] = {}
            item[object]['geohash']['value'] = hash
            item[object]['geohash']['type'] = 'Property'
            collection.save(item)
    server.stop()
