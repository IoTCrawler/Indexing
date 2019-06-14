In this code you can find two functions:

get_geohash(server_details, object) : returns the list of geohashes 

update_dataset_geohash(server_details, object) : update the database with geohsh

The server_details is :
 

MONGO_details = {'LOCAL_HOST': LOCAL_HOST,
                 'MONGO_HOST': MONGO_HOST,
                 'MONGO_DB': MONGO_DB,
                 'MONGO_USER': MONGO_USER,
                 'MONGO_PASS': MONGO_PASS,
                 'MONGO_PORT': MONGO_PORT,
                 'COLLECTION_NAME': COLLECTION_NAME}

In our data object = 'attrs' as our data looks like below:

{
  
	"_id":{
		"id": "urn:ngsi-ld:Point:{id}",
		
"type": "Point"
	},

	"attrs":{
		

"ontologyClass":{
    
			"type": "Property",
    
			"value": "geo:Point"
  
		},
		
  "prefix":{
			
"type": "Property",
    
			"value": "{prefix}"
  
		},
		

  "lat": {
		
    	"type": "Property",
		
    	"value": {"data"
}  
		},
		
  "long": {
    
			"type": "Property",
    
			"value": {"data"
}
  
		},
		
  "alt": {
    
			"type": "Property",
    
			"value": {"data"
}
  
		},
		
  "relativeLocation": {
    
			"type": "Property",
    
			"value": {"text"
} 
  
		},
		
  "@context": ["http://uri.etsi.org/ngsi-ld/coreContext.jsonld"]


	}
}

