import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BannerSection from '../components/homepage/HomepageBanner';
import HelloWorld from '../components/hello-world';
import {ReactServerAgent} from "react-server";
import Example from '../components/homepage/HomepageExample';
import Features from '../components/homepage/Features';

// Syntax highlighting - runs on the fly.
// TODO move to middleware
require('prismjs');
require('./prism.css');

const getData = path => ReactServerAgent
	.get("/api/docs", {path})
	.then(res => res.body);

export default class Homepage {
	getElements() {
		const path = "/docs/client-transitions.md";

		return [
			getData(path).then(function (res) {
				return (
					<div className="content">
						<Header/>
						<HelloWorld {...res} />
						<BannerSection/>
						<Example/>
						<Features/>
						<Footer/>
					</div>
				);
			}),
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
