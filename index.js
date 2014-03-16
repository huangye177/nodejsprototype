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

// load server.js to process path-handler mapping with the route method from router.js
server.start(router.route, handle);