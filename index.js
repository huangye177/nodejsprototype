// include necessary js
var server = require("./server");
var router = require("./router");
var requestHandlers = require("./requestHandlers");

// map path to requestHandler's methods
var handle = {}
handle["/"] = requestHandlers.start;
handle["/start"] = requestHandlers.start;
handle["/fileupload"] = requestHandlers.fileupload;
handle["/upload"] = requestHandlers.upload;
handle["/show"] = requestHandlers.show;
handle["/mongobasic"] = requestHandlers.mongobasic;
handle["/mongorun"] = requestHandlers.mongorun;

// load server.js to process path-handler mapping with the route method from router.js

// router.route(handle, pathname, response, request) redirects the 
// incoming requests to proper handler according to the given pathname, 
// then sends the results to response
server.start(router.route, handle);