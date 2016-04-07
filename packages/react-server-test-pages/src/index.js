import {start} from 'react-server-cli'
import {dirname} from 'path';

// `start` finds the routes file relative to working directory.
// Let's make it relative to _us_.
process.chdir(dirname(module.filename));

start("routes.js", {
	port        : 3000,
	jsPort      : 3001,
	hot         : true,
	minify      : false,
	compileOnly : false,
	jsUrl       : null,
})
