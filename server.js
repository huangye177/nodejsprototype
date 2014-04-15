var http = require("http");
var url = require("url");

function start(route, handle) {
	
  // define method to process http request and response
  function onRequest(request, response) {
    var pathname = url.parse(request.url).pathname;
    console.log("Request for " + pathname + " received.");

    // route the request and response to individual handle based on path name
    route(handle, pathname, request, response);
  }

  // start server with given onRequest method and port
  http.createServer(onRequest).listen(8888);
  console.log("Server has started.");
}

exports.start = start;