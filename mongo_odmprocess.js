var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// process controlling variables
var date = new Date();
var valueRange = 1000;
var insertRepeat = 1;
var searchRepeat = 1;

var previousFinished;
var intervalId;
var completedSearch;
var isSimulationRunning = false;

var insertStartTime;
var insertEndTime;
var searchStartTime;
var searchEndTime;

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
var queryReturnOption = 'fkDataSeriesId measDateUtc measDateSite project_id measvalue refMeas reliability';
	
// define schmea
var measSchema = new Schema({
	fkDataSeriesId: Number,
    measDateUtc: Date,
    measDateSite: Date,
    project_id: Number,
    measvalue: Number,
    refMeas: Boolean,
    reliability: Number
}, { collection: 'gm_std_measurements_coveringindex' });

// define index in schema level
measSchema.index(indexObject); 

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

// compile the model
var Meas = mongoose.model('Meas', measSchema);

function basicProcess(insertrepeatParam, searchrepeatParam) {
	
	console.log("basicProcess started... ");
	
	var Meas = mongoose.model('Meas', measSchema);
	
	mongoose.connect('mongodb://localhost:27017/testdb', function(err) {
		
		if(err) {console.log(err);}
		
		var currentDate = new Date();
		
		var amount = 100 * 1000;
		for (var i = 0; i < amount; i++) {
			
            var ranNumber = Math.floor((Math.random() * 1000) + 1);

			var singleMeas = new Meas({ fkDataSeriesId: ranNumber, 
					measDateUtc: currentDate, measDateSite: currentDate,
					project_id: ranNumber, measvalue: ranNumber, 
					refMeas: false, reliability: 1});
			
			
			singleMeas.save();
			
			if (i % 100 == 0) {
				console.log("100 records created, next one: " + i);
			}
				
			// save instance
			// singleMeas.save(function (err, meas) {
			//	if (err) return console.error(err);
			//	console.log("Once instance saved. ");
			// });
		}
		
		console.log("All instance saved. ");
	});
}

function process(insertrepeatParam, searchrepeatParam) {
	
	// fetch passed-in parameters
    if (insertrepeatParam && insertrepeatParam > 0) {
        insertRepeat = insertrepeatParam;
    }

    if (searchrepeatParam && searchrepeatParam > 0) {
        searchRepeat = searchrepeatParam;
    }
	
	// drop historical database by creating or connecting to target database
	mongoose.connect('mongodb://localhost:27017/testdb', function() {
		if(mongoose.connection.db) {
			console.log("* Historical database found, dropping...");
			mongoose.connection.db.dropDatabase();
			
			sleep(5 * 1000);
		}
		
	}); // end of drop database callback
	
	// (re-)create and open mongoose connection
	mongoose.connect('mongodb://localhost:27017/testdb', function(err) {
		
		if(err) {console.error(err);}
	
		// mongoose.connection.on('error', console.error.bind(console, 'MongoDB ODM connection error:'));
		mongoose.connection.once('open', function(err) {
			if(err) {console.error(err); console.error("BOMB+++")}
	  		console.log('* MongoDB ODM connection established!');
		});
		
		// new some data
		var currentDate = new Date();
		var singleMeas = new Meas({ fkDataSeriesId: 600, 
				measDateUtc: currentDate, measDateSite: currentDate,
				project_id: 1000, measvalue: 1000, 
				refMeas: false, reliability: 1});

		console.log(singleMeas.fkDataSeriesId);
		console.log(singleMeas.datetimeString);

		singleMeas.printData();

		// save instance
		singleMeas.save(function (err, meas) {
			if (err) return console.error(err);
			console.log("instance saved: " + meas);
		  	meas.printData();
		});

		// find all 
		Meas.find(function (err, allmeas) {
		  if (err) return console.error(err);
		  console.log(allmeas);
		})

		// find by DataSeriesId with Mongoose built-in methods
		Meas.find({ fkDataSeriesId: 600 }, queryReturnOption, function(err, foundMeas) {
			if (err) return console.error(err);
			console.log(foundMeas);
		})

		// find with statics method
		Meas.findByDataSeriesId(600, function(err, founds) {
			console.log(founds);
		})
	
	}); // end of (re-)open/create database callback
	
}

function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
  }

exports.process = process;
exports.basicProcess = basicProcess;




