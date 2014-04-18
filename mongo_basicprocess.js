var mongoClient = require('mongodb').MongoClient,
util = require('util');

var insertIntervalTime = 1000;
var searchIntervalTime = 10000;
var insertPerInterval = 50000;
var searchPerInterval = 1000;

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
var interval_select_id;
var insert_counter;
var select_counter;

var dbPool;
var isSimulationRunning = false;
var isInsertIntervalFinished = true;
var isSelectIntervalFinished = true;

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
	select_counter = 0;
	
	// fetch passed-in parameters
    if (insertrepeatParam && insertrepeatParam > 0) {
        insertRepeat = insertrepeatParam;
    } else {
		insertRepeat = 1000;
	}

    if (searchrepeatParam && searchrepeatParam > 0) {
        searchRepeat = searchrepeatParam;
    } else { 
		searchRepeat = 1000;
	}

	if(insertPerInterval > insertRepeat) {
		insertPerInterval = insertRepeat;
	} else {
		insertPerInterval = 50000;
	}
	
	if(searchPerInterval > searchRepeat) {
		searchPerInterval = searchRepeat;
	} else {
		searchPerInterval = 1000;
	}
	
	// set the search response threshold for massive concurrency 
	searchCompletionThreshold = searchRepeat * 1;
	
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
						// start insert interval, which will be followed by the search interval
						// set the insert-search scenario sync check interval
					    insertStartTime = new Date();
						isInsertIntervalFinished = false;
						interval_insert_id = setInterval(processCreate, insertIntervalTime);
						
			    }); // end of index creation
		    }); // end of new db connection establish for following tests
		}); // end of drop historcial db
    }); // end of first db connection
}

function processCreate() {
	
	if(isInsertIntervalFinished) {
		return;
	}
	
	// get target collection
	var collection = dbPool.collection('gm_std_measurements_coveringindex');
	
	if(insert_counter < insertRepeat) {
		
		// insert is not yet all sent out, continue to insert
		
		// print awaiting status
	    util.print(".(" + insert_counter + ")");
	
		var date = new Date();
		for(var i = 0; i < insertPerInterval; i++) {

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
				// by then the isInsertIntervalFinished is already marked as finished
				if(isInsertIntervalFinished) {
					return;
				}
				
				// log time
	            insertEndTime = new Date();
				var duration = (insertEndTime.getTime() - insertStartTime.getTime()) / 1000;
				insert_counter = 0;
				isInsertIntervalFinished = true;
				
				console.log("");
	            console.log("* All inserted Document synchronized! (" + count + " in " + duration + " seconds)");
				
				// start search scenario
				console.log("* ProcessSearch running and processing massive concurrent queries...");
				
				searchStartTime = new Date();
				isSelectIntervalFinished = false;
				interval_select_id = setInterval(processSearch, searchIntervalTime);
				
	
	        } else {
				// do nothing, waiting for the next round of interval check
	        }
	    });
	} 
}

function processSearch() {

	if(isSelectIntervalFinished) {
		return;
	}

	// print awaiting status
    util.print(".");

    var collection = dbPool.collection('gm_std_measurements_coveringindex');
	
    for (var i = 0; i < searchPerInterval; i++) {
        // Locate all the entries using find
        var ranNumber = Math.floor((Math.random() * valueRange) + 1);

        var query = {
            'fkDataSeriesId': ranNumber
        };

        collection.find(query, queryOption).toArray(function(err, results) {
            // console.dir(results);
			select_counter++;
			
			// most of search queries are done
			if(select_counter == Math.floor(searchCompletionThreshold)) { 
				// log time
		        searchEndTime = new Date();
				var timeduration =  (searchEndTime.getTime() - searchStartTime.getTime()) / 1000;
				console.log("");
				console.log("* Search Thresthold reached! (" + timeduration + " seconds)");
			}
        });
	}
		
	// check if interval is finished
	if(select_counter >= searchRepeat) {
		
		clearInterval(interval_select_id);
		isSelectIntervalFinished = true;
		
		console.log("");
		console.log("* All documents queried! (" + select_counter + ")");
		
		var insertDuration = (insertEndTime.getTime() - insertStartTime.getTime()) / 1000;
		var searchDuration = (searchEndTime.getTime() - searchStartTime.getTime()) / 1000;
		var insertIntervalOverhead = (insertRepeat / insertPerInterval) * (insertIntervalTime / 1000);
		var selectIntervalOverhead = (searchRepeat / searchPerInterval) * (searchIntervalTime / 1000);
		var resultStr = "* Done! \n* Number of Insert [with insert-interval overhead: " +  
						insertIntervalOverhead + " seconds] " + 
						insertRepeat + " (" + insertDuration + " seconds); " + 
						"\n* Number of Search [with query-interval overhead: " + 
						selectIntervalOverhead + " seconds] " + 
						searchRepeat + " (" + searchDuration + " seconds).";
						
		console.log(resultStr);
		isSimulationRunning = false;
	}
}

exports.process = process;


