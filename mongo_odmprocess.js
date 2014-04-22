var mongoose = require('mongoose');
var util = require('util');

var Schema = mongoose.Schema;

var insertPerIntervalFinal = 50000;
var searchPerIntervalFinal = 1000;

var insertIntervalTime = 1000;
var searchIntervalTime = 10000;
var insertPerInterval = 50000;
var searchPerInterval = 1000;

var valueRange = 1000;
var insertRepeat = 1000;
var searchRepeat = 1000;
var date = new Date();

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

// index object
var indexObject = {
    fkDataSeriesId: 1,
    measDateUtc: 1,
    measDateSite: 1,
    project_id: 1,
    measvalue: 1,
    refMeas: 1,
    reliability: 1
};

// query returning
var queryReturnOption = {
    fkDataSeriesId: 1,
    measDateUtc: 1,
    measDateSite: 1,
    project_id: 1,
    measvalue: 1,
    refMeas: 1,
    reliability: 1,
    _id: 0
};
// var queryReturnOption = 'fkDataSeriesId measDateUtc measDateSite project_id measvalue refMeas reliability';


// make the infrastructure of Mongoose upon MongoDB
// ODM schema and model
var measSchema;
var Meas;
function makeSchema() {

	// define schema
	if(!Meas) {
		
		measSchema = new Schema({
			fkDataSeriesId: Number,
		    measDateUtc: Date,
		    measDateSite: Date,
		    project_id: Number,
		    measvalue: Number,
		    refMeas: Boolean,
		    reliability: Number
		}, { collection: 'gm_std_measurements_coveringindex' });

		// define index in schema level
		measSchema.index(indexObject, {name: 'default_mongodb_test_index'});

		// instance methods
		// NOTE: methods must be added to the schema before compiling it with mongoose.model()
		measSchema.methods.printData = function () {
		  console.log("DS: " + this.fkDataSeriesId + 
					  "; DateUtc: " + this.measDateUtc + 
					  "; measValue" + this.measvalue);
		}

		// statics methods
		measSchema.statics.findByDataSeriesId = function(dsId, cb) {
			this.find({fkDataSeriesId: dsId}, cb);
		}

		// virtuals attributes (not persistent)
		measSchema.virtual('datetimeString').get(function () {
		  return "UTC: " + this.measDateUtc + '; SITE: ' + this.measDateSite;
		});

		// compile the model from Schema
		Meas = mongoose.model('Meas', measSchema);
	}	
}

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
		insertPerInterval = insertPerIntervalFinal;
	}
	
	if(searchPerInterval > searchRepeat) {
		searchPerInterval = searchRepeat;
	} else {
		searchPerInterval = searchPerIntervalFinal;
	}
	
	// set the search response threshold for massive concurrency 
	searchCompletionThreshold = searchRepeat * 0.99;
	
	// make debug mode if necessary 
	// mongoose.set('debug', true);
	
	// hook the connection open and error events
	mongoose.connection.once('open', function(err) {
		if(err) {console.error(err); console.error("BOMB+++")}
	  	console.log('* MongoDB ODM connection established!');
	});
	
	mongoose.connection.on('error', function(err) {
	    console.error('MongoDB error: %s', err);
	});
	
	// drop historical database by creating or connecting to target database
	mongoose.connect('mongodb://localhost:27017/testdb', function() {
		if(mongoose.connection.db) {
			console.log("* Historical database found, dropping for 3 seconds...");
			mongoose.connection.db.dropDatabase(function(err) {
				
				sleep(3 * 1000);
				console.log("DB dropped!");
				
				// define the schema
				makeSchema();
				
				// use the 'same' default connection to proceed
				insertStartTime = new Date();
				isInsertIntervalFinished = false;
				interval_insert_id = setInterval(processCreate, insertIntervalTime);
				
				console.log("All document inserted!");
				
			});
		}
		
	}); // end of drop database callback
}

function processCreate() {
	
	if(isInsertIntervalFinished) {
		return;
	}
	
	if(insert_counter < insertRepeat) {
		
		// insert is not yet all sent out, continue to insert
		// print awaiting status
	    util.print(".(" + insert_counter + ")");
	
		var currentDate = new Date();
		for (var i = 0; i < insertPerInterval; i++) {

            var ranNumber = Math.floor((Math.random() * 1000) + 1);

			var singleMeas = new Meas({ fkDataSeriesId: ranNumber, 
					measDateUtc: currentDate, measDateSite: currentDate,
					project_id: ranNumber, measvalue: ranNumber, 
					refMeas: false, reliability: 1});
					
			singleMeas.save();
			insert_counter++;
		}
	}
	else 
	{
		// after all insert requests are sent, check whether all inserts are synchronized 
		
		// print awaiting status
	    util.print(".");
		
		// wait for all inserted Documents to be synchronized
		Meas.count(function(err, count){
			
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
	
    for (var i = 0; i < searchPerInterval; i++) {
        // Locate all the entries using find
        var ranNumber = Math.floor((Math.random() * valueRange) + 1);

        var query = {
            'fkDataSeriesId': ranNumber
        };

		// find by DataSeriesId with Mongoose built-in methods
		Meas.find(query, queryReturnOption, function(err, foundMeas) {
			if (err) return console.error(err);
			
			// console.dir(foundMeas);
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


function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
}


exports.process = process;


