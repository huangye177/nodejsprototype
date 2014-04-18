var mongoClient = require('mongodb').MongoClient,
util = require('util');

var valueRange = 1000;
var insertRepeat = 1000;
var searchRepeat = 100;
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
var intervalId;
var completedSearch;

var dbPool;
var isSimulationRunning = false;

var insertStartTime;
var insertEndTime;
var searchStartTime;
var searchEndTime;

function process(insertrepeatParam, searchrepeatParam) {

	// ensure only one simulation is being processed
	if(isSimulationRunning) {
		console.log("- A simulation is ongoing, newly arrived request (" + insertrepeatParam + 
					"/" + searchrepeatParam +") quits.");
		return;
	}
	
	isSimulationRunning = true;
	
	// fetch passed-in parameters
    if (insertrepeatParam && insertrepeatParam > 0) {
        insertRepeat = insertrepeatParam;
    }

    if (searchrepeatParam && searchrepeatParam > 0) {
        searchRepeat = searchrepeatParam;
    }

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

		        console.log("* MongoDB connection is being requested...");

		        // fetch DB connection
		        dbPool = database;

		        console.log("* MongoDBProcess is processing...");

		        // STEP 3: continue the rest of DB process steps
		        processCreate();

		        // set the insert-search scenario sync check interval
		        // NOTICE, the frequency can NOT be too small, otherwise will exhaust mongoDB connection!
		        previousFinished = false;
		        intervalId = setInterval(syncInsertAndSearchScenario, 5000);
		    });
		});
    });
}

function syncInsertAndSearchScenario() {

	// ensure the interval check is not yet completed
    if (previousFinished == true) {
        return;
    }

	// print awaiting status
    util.print(".");

    // create new collection under database
    var collection = dbPool.collection('gm_std_measurements_coveringindex');

    collection.count(function(err, count) {
        // check for the moment when all Documents were inserted, then perform processSearch case
        if (count == insertRepeat) {

            // log time
            insertEndTime = new Date();

            previousFinished = true;
            clearInterval(intervalId);
            console.log("* All inserted Document synchronized! (" + count + ")");

            // start search scenario
            processSearch();
        } else {
			// do nothing, waiting for the next round of interval check
        }
    });
}

function processCreate() {

    console.log("* ProcessCreate started...");

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

        // log time
        insertStartTime = new Date();

        // add all Documents
        for (var i = 0; i < insertRepeat; i++) {
            var ranNumber = Math.floor((Math.random() * valueRange) + 1);

            // insert objects after table and index creation
            var istObject = {
                fkDataSeriesId: ranNumber,
                measDateUtc: date,
                measDateSite: date,
                project_id: ranNumber,
                measvalue: ranNumber,
                refMeas: false,
                reliability: 1.0
            };

            collection.insert(istObject, { w: 1 }, function(err, docs) {
                if (err) {
                    console.log(err.message);
                    throw err;
                } else {
					// do noting to responsed inserted Document
                }
            });
        }
        console.log("* Documents created!");
    });
    // end of table and index creation
}

function processSearch() {

    console.log("* ProcessSearch started...");

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

            // all search queries are done
            if (completedSearch == searchRepeat) {
                console.log("* All documents queried! (" + completedSearch + ")");

                // log time
                searchEndTime = new Date();
                var insertDuration = (insertEndTime.getTime() - insertStartTime.getTime()) / 1000;
                var searchDuration = (searchEndTime.getTime() - searchStartTime.getTime()) / 1000;
                var resultStr = "* Done! Number of Insert: " + insertRepeat + " (" + insertDuration +
                				" seconds); Number of Search: " + searchRepeat +
                				" (" + searchDuration + " seconds).";

                console.log(resultStr);
                dbPool.close();
				isSimulationRunning = false;
            }
        });
    }
}

exports.process = process;


