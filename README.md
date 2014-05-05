# What is nodejsprototype

**nodejsprototype** contains a pack of functionality-testing prototypes for node.js

## How to

prerequisites: (or from European mirror: `npm --registry http://registry.npmjs.eu/ install MODULE_NAME`)

`npm install formidable` 

`npm install mongodb`

`npm install mongoose`

START SERVER: `node index.js`

VISIT: `localhost:8888`

===============

## Tips

to clear NPM installation:

`rm -rf node_modules/`

`npm cache clean`

to fix warning issue like "Failed to load c++ bson extension, using pure JS version"

for mongodb npm plugin: go to 'node_modules/mongodb/node_modules/bson/ext/index.js'

for mongoose npm plugin: go to 'node_modules/mongoose/node_modules/mongodb/node_modules/bson/ext/index.js'

change `bson = require('../build/Release/bson'); ` into `bson = require('bson');`

===============

## Prototype Content

including:

* Image upload (from The Node Beginner Book)

* MongoDB basic CRUD scenarios

* Mongoose based ODM 

===============

## Source Code Hints

### index.js

The initial point of the program, which defines URL-path mapping to "requestHandlers" methods, and invokes server starting script "server.js" and routing rules (router.js).

### server.js

Starts a server with given "router" and "requestHandlers". It creates a server on port 8888, gets the path from input request url, and transfers the rest of processing to the "router" with parameter values and methods including: requestHandlers, path-name, http-request, and http-reponse.

### rounter.js

Responding on the invoke from "server.js" by mapping the path-name into an inner method of given "requestHandlers". The http-request and http-response is also transferred to "requestHandlers".

### requestHandlers.js

Responding the input invokes with a list of exported methods, such as returning start/file-upload/mongo-simulation pages, parse uploaded file via formidable form, and run MongoDB related simulations (basic and ODM) with given parameters. 

### mongo_basicprocess.js

It uses the Node.js default MongoDB parser to simulate a delete-insert-query event chain, wherein each event consists of a number of repeat in a given time interval; by default, each insert interval is called every single second, wherein 50000 Documents are generated and (to be) inserted in each interval; on the other side, each search interval is called every 10 seconds, wherein 1000 Document search queries are generated and (to-be) sent out. -- The design of interval mechanism is to overcome V8 engine's limitation on RAM while a large number of objects are needed during the process. The event mechanism of Node.js then will not be blocked.

Inside the delete-insert-query event chain, the start of next event must be wrapped inside the callback method of the previous one because of Node.js parallel execution pattern. Specifically, once all Documents are sent out from Node.js for insert, the process must check the number of Documents in MongoDB on parallel to ensure all inserts are really executed by MongoDB.

### mongo_odmprocess.js

This script uses the same delete-insert-query event chain and interval mechanism as described for mongo_basicprocess.js. The difference is, each insert interval means 5000 Documents are generated and (to be) inserted in each interval; this is because of more RAM usage requirement from the adopted ODM framework: mongoose.


