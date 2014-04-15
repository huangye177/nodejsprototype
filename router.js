function route(handle, pathname, request, response) {
  console.log("About to route a request for " + pathname);
  if (typeof handle[pathname] === 'function') {
	// load proper method in requestHandlers based on path name
	// response is the first parameter, because the second parameter request can be omitted sometimes
    handle[pathname](response, request);
  } else {
    console.log("No request handler found for " + pathname);
    response.writeHead(404, {"Content-Type": "text/html"});
    response.write("404 Not found");
    response.end();
  }
}

exports.route = route;