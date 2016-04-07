import {start} from 'react-server-cli'
import {dirname} from 'path';
import React from 'react';

// Let's not make each page import this.
global.React = React;

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
