var mongoClient = require('mongodb').MongoClient,
util = require('util');

var valueRange = 1000;
var insertRepeat = 1000;
var searchRepeat = 1000;
var date = new Date();

var queryOption = {
    fkDataSeriesId: 1,
    measDateUtc: 1,
    measDateSite: 1,
    project_id: 1,
    measvalue: 1,
    refMeas: 1,
    reliability: 1,
    _id: 0
};

var previousFinished;
var interval_insert_id;
var insert_counter;
var completedSearch;

var dbPool;
var isSimulationRunning = false;
var isIntervalFinished = true;

var insertStartTime;
var insertEndTime;
var searchStartTime;
var searchEndTime;
var searchCompletionThreshold;

function process(insertrepeatParam, searchrepeatParam) {

	// ensure only one simulation is being processed
	if(isSimulationRunning) {
		console.log("- A simulation is ongoing, newly arrived request (" + insertrepeatParam + 
					"/" + searchrepeatParam +") quits.");
		return;
	}
	
	isSimulationRunning = true;
	insert_counter = 0;
	
	// fetch passed-in parameters
    if (insertrepeatParam && insertrepeatParam > 0) {
        insertRepeat = insertrepeatParam;
    }

    if (searchrepeatParam && searchrepeatParam > 0) {
        searchRepeat = searchrepeatParam;
    }

	// set the search response threshold for massive concurrency 
	searchCompletionThreshold = searchRepeat * 0.99;
	
	// STEP 1: clean historical database
    mongoClient.connect('mongodb://127.0.0.1:27017/testdb', function(err, db) {
        if (err) throw err;

        db.dropDatabase(function(err, done) { 
			console.log("* Database dropped and recycled.");
			db.close();
			
			// STEP 2: initial new database connection
		    mongoClient.connect("mongodb://localhost:27017/testdb", 
				{ db: { native_parser: true } }, function(err, database) {
					
		        if (err) {
					console.log(err.message);
					throw err;
				}

		        console.log("* MongoDB connection is being established...");

		        // fetch DB connection
		        dbPool = database;

		        // STEP 3: continue the rest of DB process steps
				// start interval after database connected

			    // create new collection under database
			    var collection = dbPool.collection('gm_std_measurements_coveringindex');

			    // create table and index
			    collection.ensureIndex({
			        fkDataSeriesId: 1,
			        measDateUtc: 1,
			        measDateSite: 1,
			        project_id: 1,
			        measvalue: 1,
			        refMeas: 1,
			        reliability: 1
			    	}, { name: "default_mongodb_test_index" }, function(err, indexName) {

			        	if (err) throw err;
			        	console.log("* Index created!");
			
						console.log("* ProcessCreate started...");
						
						// log time
					    insertStartTime = new Date();
					
						// start insert interval, which will be followed by the search interval
						// set the insert-search scenario sync check interval
						isIntervalFinished = false;
						interval_insert_id = setInterval(processCreate, 1000);
						
			    }); // end of index creation
		    }); // end of new db connection establish for following tests
		}); // end of drop historcial db
    }); // end of first db connection
}

function processCreate() {
	
	if(isIntervalFinished) {
		return;
	}
	
	// get target collection
	var collection = dbPool.collection('gm_std_measurements_coveringindex');
	
	if(insert_counter < insertRepeat) {
		
		// insert is not yet all sent out, continue to insert
		
		// print awaiting status
	    util.print(".(" + insert_counter + ")");
	
		var date = new Date();
		var amount =  50 * 1000;
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
				insert_counter++;
			});
		}
	}
	else 
	{
		// after all insert requests are sent, check whether all inserts are synchronized 
		
		// print awaiting status
	    util.print(".");
		
		// wait for all inserted Documents to be synchronized
		collection.count(function(err, count) {
			
	        // check for the moment when all Documents were inserted, then perform processSearch case
	        if (count >= insertRepeat) {
		
	            clearInterval(interval_insert_id);
	
				// critical, because the callback of this method could already arrive late
				// by then the isIntervalFinished is already marked as finished
				if(isIntervalFinished) {
					return;
				}
				
				// log time
	            insertEndTime = new Date();
				var duration = (insertEndTime.getTime() - insertStartTime.getTime()) / 1000;
				insert_counter = 0;
				isIntervalFinished = true;
				
				console.log("");
	            console.log("* All inserted Document synchronized! (" + count + " in " + duration + " seconds)");
				
	            // start search scenario
	            processSearch();
	
	        } else {
				// do nothing, waiting for the next round of interval check
	        }
	    });
	} 
}

function processSearch() {

    console.log("* ProcessSearch running and processing massive concurrent queries...");

    // reset search counter
    completedSearch = 0;

    var collection = dbPool.collection('gm_std_measurements_coveringindex');

    // log time
    searchStartTime = new Date();

    for (var i = 0; i < searchRepeat; i++) {
        // Locate all the entries using find
        var ranNumber = Math.floor((Math.random() * valueRange) + 1);

        var query = {
            'fkDataSeriesId': ranNumber
        };

        collection.find(query, queryOption).toArray(function(err, results) {
            // console.dir(results);
            completedSearch += 1;
			
            // most of search queries are done
			if (completedSearch == searchCompletionThreshold) {
				// log time
                searchEndTime = new Date();
				var timeduration =  (searchEndTime.getTime() - searchStartTime.getTime()) / 1000;
				console.log("* Search Thresthold reached! (" + timeduration + " seconds)");
			}
			
			// all search queries are done (although some are delayed due to network or I/O problem)
            if (completedSearch >= searchRepeat) {
	
                console.log("* All documents queried! (" + completedSearch + ")");
                
                var insertDuration = (insertEndTime.getTime() - insertStartTime.getTime()) / 1000;
                var searchDuration = (searchEndTime.getTime() - searchStartTime.getTime()) / 1000;
                var resultStr = "* Done! Number of Insert: " + insertRepeat + " (" + insertDuration +
                				" seconds); Number of Search: " + searchRepeat +
                				" (" + searchDuration + " seconds).";

                console.log(resultStr);
				isSimulationRunning = false;
            }
        });
    }
}

exports.process = process;


