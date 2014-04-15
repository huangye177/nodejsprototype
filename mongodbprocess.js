var mongoClient = require('mongodb').MongoClient, 
	format = require('util').format;

var valueRange = 100;
var insertRepeat = 1000;
var searchRepeat = 100;
var date = new Date();
var queryOption = {fkDataSeriesId:1, measDateUtc:1, measDateSite:1, 
    			   project_id:1, measvalue:1, refMeas:1, 
    			   reliability:1, _id:0};

var previousFinished;
var intervalId;
var completedSearch;

function process() {
	
	console.log("MongoDBProcess is processing...");
	
	processClean();
	
	processCreate();
	
	// set the insert-search scenario sync check interval
	previousFinished = false;
	intervalId = setInterval(syncInsertAndSearchScenario, 1000);

}

function syncInsertAndSearchScenario() {
	
	if(previousFinished == true) {
		return;
	}
	
	mongoClient.connect('mongodb://127.0.0.1:27017/testdb', {db: {native_parser: true}}, function(err, db) {
    	if(err) throw err;
		
			// create new collection under database
    		var collection = db.collection('gm_std_measurements_coveringindex');
    	
			collection.count(function(err, count) {
				// check for the moment when all Documents were inserted, then perform processSearch case
        		if(count == insertRepeat) {
					previousFinished = true;
					clearInterval(intervalId);
					console.log("* All inserted Document synchronized! (" + count + ")");
					db.close();
					
					// start search scenario
					processSearch();
				}
      		});	
 	});
}

function processClean() {
	
	// drop existing database
	mongoClient.connect('mongodb://127.0.0.1:27017/testdb', {db: {native_parser: true}}, function(err, db) {
		if(err) throw err;
		
		db.dropDatabase();
		db.close();
		console.log("* Database recycled.");
	});
}

function processCreate() {
	
	console.log("* ProcessCreate started...");
	
	// enable the driver to use the C/C++ bson parser when possible 
	mongoClient.connect('mongodb://127.0.0.1:27017/testdb', {db: {native_parser: true}}, function(err, db) {
    	if(err) throw err;
		
		// create new collection under database
    	var collection = db.collection('gm_std_measurements_coveringindex');
    	
    	// create table and index
    	collection.ensureIndex({fkDataSeriesId:1, measDateUtc:1, measDateSite:1, 
    							project_id:1, measvalue:1, refMeas:1, reliability:1}, 
    							{name: "default_mongodb_test_index"},
    							function(err, indexName) {
    		if (err) throw err;
    		console.log("* Index created!");
    		
			// add all Documents 
    		for (var i = 0; i < insertRepeat; i++) {
    			var ranNumber = Math.floor((Math.random() * valueRange)+1);	
    			
    			// insert objects after table and index creation
    			var istObject = {fkDataSeriesId : ranNumber, measDateUtc: date, measDateSite : date, 
    					project_id : ranNumber, measvalue: ranNumber, refMeas: false, 
    					reliability: 1.0};
    					
    			collection.insert(istObject, function(err, docs) {
					if (err) console.warn(err.message);
    			});
    		}
    		
    		console.log("* Documents created!");
    	}); // end of table and index creation
 	});
}

function processSearch() {
	
	console.log("* ProcessSearch started...");
	
	// reset search counter
	completedSearch = 0;
	
	mongoClient.connect('mongodb://127.0.0.1:27017/testdb', {db: {native_parser: true}}, function(err, db) {
    	if(err) throw err;
		
		var collection = db.collection('gm_std_measurements_coveringindex');
		
		for (var i = 0; i < searchRepeat; i++) { 
			// Locate all the entries using find
	    	var ranNumber = Math.floor((Math.random() * valueRange) + 1);

			var query = {'fkDataSeriesId' : ranNumber};

			collection.find(query, queryOption).toArray(function(err, results) {
				// console.dir(results);
				completedSearch += 1;
				
				if(completedSearch == searchRepeat) {
					console.log("* All documents queried! (" + completedSearch + ")");
				}
	      	});
		}
		
 	});
}

exports.process = process;


