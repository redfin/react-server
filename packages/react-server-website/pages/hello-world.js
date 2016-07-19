import React from 'react';
import HelloWorld from '../components/hello-world';


// Syntax highlighting - runs on the fly.
// TODO move to middleware
require('prismjs');
require('prismjs/components/prism-jsx');
require('prismjs/components/prism-bash');
require('./prism.css');

export default class SimplePage {
	getElements() {
		return [
			<HelloWorld/>,
		];
	}

	getMetaTags() {
		return [
			{charset: 'utf8'},
			{'http-equiv': 'x-ua-compatible', 'content': 'ie=edge'},
			{name: 'viewport', content: 'width=device-width, initial-scale=1'},
			{name: 'description', content: 'hello world, powered by React Server'},
			{name: 'generator', content: 'React Server'},
		];
	}
}
