import React from 'react';
import HelloWorld from '../components/hello-world';
import {ReactServerAgent} from "react-server";


// Syntax highlighting - runs on the fly.
// TODO move to middleware
require('prismjs');
require('./prism.css');

const getData = path => ReactServerAgent
	.get("/api/docs", {path})
	.then(res => res.body);

export default class SimplePage {
	getElements() {
		const path = "/docs/client-transitions.md";
		return [
			getData(path).then(res => <HelloWorld {...res} />),
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
