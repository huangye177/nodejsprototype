var mongoClient = require('mongodb').MongoClient, 
	format = require('util').format;

function process() {
	
	console.log("MongoDBProcess is processing...");

	var documentCount = 1000;
	var date = new Date();
    var queryOption = {fkDataSeriesId:1, measDateUtc:1, measDateSite:1, 
    				  project_id:1, measvalue:1, refMeas:1, 
    				  reliability:1, _id:0};

	// drop existing database
	mongoClient.connect('mongodb://127.0.0.1:27017/testdb', {db: {native_parser: true}}, function(err, db) {
		if(err) throw err;
		
		db.dropDatabase();
		db.close();
		console.log("* Database recycled.");
		
	});
	
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
    		
    		for (var i = 0; i < documentCount; i++) {
    			var ranNumber = Math.floor((Math.random()*1000)+1);	
    			
    			// insert objects after table and index creation
    			var istObject = {fkDataSeriesId : ranNumber, measDateUtc: date, measDateSite : date, 
    					project_id : ranNumber, measvalue: ranNumber, refMeas: false, 
    					reliability: 1.0};
    					
    			collection.insert(istObject, function(err, docs) {
					if (err) console.warn(err.message);
			
      				
    			});
    		}
    		
    		collection.count(function(err, count) {
        		console.log(format("count = %s", count));
      		});
    		
    		console.log("* Documents created!");
    	}); // end of table and index creation
 	});
 	
 	
 	setTimeout(function() {
  		console.log('hello world!');
	}, 5000);
	
	mongoClient.connect('mongodb://127.0.0.1:27017/testdb', {db: {native_parser: true}}, function(err, db) {
    	if(err) throw err;
		
		
    	var i = 0;
		var collectionCount = 0;
		while(collectionCount < documentCount) {
			
			// create new collection under database
    		var collection = db.collection('gm_std_measurements_coveringindex');
    	
			console.log("### " + i);
			i += 1;
			collection.count(function(err, count) {
        		collectionCount = count;
        		console.log("** tt = " + collectionCount);
      		});	
		}
		console.log("** TT = " + collectionCount);
    	
 	});
 
	// // Document search in database
	// mongoClient.connect('mongodb://127.0.0.1:27017/testdb', {db: {native_parser: true}}, function(err, db) {
		// if(err) throw err;
// 		
		// var collection = db.collection('gm_std_measurements_coveringindex');
		// collection.count(function(err, count) {
			// console.log(format("* Document count = %s", count));
      	// });
// 		
		// // Locate all the entries using find
    	// var ranNumber = Math.floor((Math.random()*1000)+1);
//     	
    	// var query = {'fkDataSeriesId' : ranNumber};
      	// collection.find(query, queryOption).toArray(function(err, results) {
        	// console.log("length: " + results.length);
        	// console.dir(results);
//         	
        	// // Let's close the db
        	// // db.close();
        	// console.log("* Document queried!");
      	// });
//       	
      	// db.close();
// 		
	// });
}

exports.process = process;


