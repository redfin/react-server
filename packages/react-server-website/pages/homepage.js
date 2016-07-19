import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import BannerSection from '../components/homepage/HomepageBanner';
import Example from '../components/homepage/HomepageExample';
import Features from '../components/homepage/Features';

export default class Homepage {
	getElements() {
		return (
			<div className="homepage">
				<Header/>
				<BannerSection/>
				<Example/>
				<Features/>
				<Footer/>
			</div>
		);
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
