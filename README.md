nodejsprototype
===============

A pack of functionality prototypes for node.js


## How to

prerequisites: (or from European mirror: `npm --registry http://registry.npmjs.eu/ install MODULE_NAME`)

`npm install formidable` 

`npm install mongodb`

`npm install mongoose`

START SERVER: `node index.js`

VISIT: `localhost:8888`

===============
## Prototype Content

including:

*	Image upload (from The Node Beginner Book)

*	MongoDB basic CRUD scenarios

*	Mongoose based ODM 

===============
## Tips

to clear NPM installation:

`rm -rf node_modules/`

`npm cache clean`

to overcome problem like "Failed to load c++ bson extension, using pure JS version"

for mongodb npm plugin: go to 'node_modules/mongodb/node_modules/bson/ext/index.js'

for mongoose npm plugin: go to 'node_modules/mongoose/node_modules/mongodb/node_modules/bson/ext/index.js'

change `bson = require('../build/Release/bson'); ` into `bson = require('bson');`





