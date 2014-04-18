var mongoClient = require('mongodb').MongoClient;

var previousFinished;
var interval_checkId;

var totalTarget = 1000 * 1000;
var operation = 0;

var dbPool;

var counter = 0;

function process() {
	mongoClient.connect("mongodb://localhost:27017/testdb", function(err, database) {

        console.log("* MongoDB connection is being requested...");

        // fetch DB connection
        dbPool = database;

		// start interval after database connected
		interval_checkId = setInterval(print, 1000);
	});
	
}

function print() {
	
	console.log("* Starting to insert another 10K records, current count: " + counter);
	
	var collection = dbPool.collection('gm_std_measurements_coveringindex');
	
	var date = new Date();
	var amount = 10 * 1000;
	for(var i = 0; i < amount; i++) {
		
		var ranNumber = Math.floor((Math.random() * 1000) + 1);

        // insert objects after table and index creation
        var istObject = {
            fkDataSeriesId : ranNumber,
            measDateUtc : date,
            measDateSite : date,
            project_id : ranNumber,
            measvalue : ranNumber,
            refMeas : false,
            reliability : 1.0
        };

		collection.insert(istObject, { w : 0 }, function(err, docs){
			if(err) {console.log(err); throw err;}
			counter++;
		});
		
	}
	
	if(counter >= totalTarget) {
		clearInterval(interval_checkId);
		console.log("Completed Insert, in total : " + counter);
		counter = 0;
	}
}

function process2() {
	
	mongoClient.connect("mongodb://localhost:27017/testdb", function(err, database) {

        console.log("* MongoDB connection is being requested...");

        // fetch DB connection
        dbPool = database;

		// start interval after database connected
		interval_checkId = setInterval(operation, 5000);
	});
}

function operation() {

	console.log("Interval called...");
	
	// create new collection under database
	var collection = dbPool.collection('gm_std_measurements_coveringindex');
	date = new Date();

	// add all Documents
	        for (var i = 0; i < 1000; i++) {
	            var ranNumber = Math.floor((Math.random() * 1000) + 1);

	            // insert objects after table and index creation
	            var istObject = {
	                fkDataSeriesId : ranNumber,
	                measDateUtc : date,
	                measDateSite : date,
	                project_id : ranNumber,
	                measvalue : ranNumber,
	                refMeas : false,
	                reliability : 1.0
	            };

	            collection.insert(istObject, { w : 1 }, function(err, docs) {
	                if (err) {
	                    console.log(err.message);
	                    throw err;
	                } else {
	                    // do noting to responsed inserted Document
	                }
	            });
	
				operation++;
				
				if (i % 100 == 0) {
					console.log("100 records created, next one: " + i);
				}
				
				if(operation >= totalTarget) {
					console.log("* Documents created!");
					clearInterval(interval_checkId);
					
				}
				
	        }
	        
}

exports.process = process;

