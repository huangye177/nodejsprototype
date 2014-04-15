var mongodbprocess = require("./mongodbprocess");

var querystring = require("querystring"),
    fs = require("fs"),
    formidable = require("formidable");

function start(response) {
  console.log("Request handler 'start' was called.");

  var body = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" content="text/html; '+
    'charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    '<h2>Basic Function List:</h2>'+
    '<p><a href="fileupload">Image Upload</a></p>'+
	'<p><a href="show">Show Uploaded Image</a></p>'+
	'<h2>MongoDB Function List:</h2>'+
    '<p><a href="mongorun">Run MongoDB Simulation</a></p>'+
    '</body>'+
    '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

function fileupload(response) {
  console.log("Request handler 'start' was called.");

  var body = '<html>'+
    '<head>'+
    '<meta http-equiv="Content-Type" content="text/html; '+
    'charset=UTF-8" />'+
    '</head>'+
    '<body>'+
    '<form action="/upload" enctype="multipart/form-data" '+
    'method="post">'+
    '<input type="file" name="upload" multiple="multiple">'+
    '<input type="submit" value="Upload file" />'+
    '</form>'+
    '</body>'+
    '</html>';

    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(body);
    response.end();
}

function upload(response, request) {
  console.log("Request handler 'upload' was called.");

  // load formidable to process file upload
  var form = new formidable.IncomingForm();
  console.log("about to parse");

  // parse uploaded file via formidable form
  form.parse(request, function(error, fields, files) {
    console.log("parsing done");
    // rename the save the uploaded file
    fs.renameSync(files.upload.path, "./tmp/test.png");
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write("received image:<br/>");
    response.write("<img src='/show' />");
    response.end();
  });
}

function show(response) {
  console.log("Request handler 'show' was called.");

  // read file from certain location and write it in binary format
  fs.readFile("./tmp/test.png", "binary", function(error, file) {
    if(error) {
      response.writeHead(500, {"Content-Type": "text/plain"});
      response.write(error + "\n");
      response.end();
    } else {
      response.writeHead(200, {"Content-Type": "image/png"});
      response.write(file, "binary");
      response.end();
    }
  });
}

function mongorun(response) {
  console.log("Request handler 'mongorun' was called.");
  
  mongodbprocess.process();
  response.writeHead(200, {"Content-Type": "text/html"});
  response.end();
}

exports.start = start;
exports.fileupload = fileupload;
exports.upload = upload;
exports.show = show;
exports.mongorun = mongorun;