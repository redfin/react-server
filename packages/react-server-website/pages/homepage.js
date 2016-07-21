import React from 'react';
import Content from '../components/homepage/HomepageContent';
import Footer from '../components/Footer';
import './homepage.less';

export default class Homepage {

	getTitle() {
		return "React Server";
	}

	getElements() {
		return (
			<div className="homepage rootContent">
				{/* TODO: Change from hardcoded serverVersion to dynamic. */}
				<Content serverVersion="0.3.4"/>
				<Footer/>
			</div>
		);
	}

	// getMetaTags() {
	// 	return [
	// 		{charset: 'utf8'},
	// 		{'http-equiv': 'x-ua-compatible', 'content': 'ie=edge'},
	// 		{name: 'viewport', content: 'width=device-width, initial-scale=1'},
	// 		{name: 'description', content: 'hello world, powered by React Server'},
	// 		{name: 'generator', content: 'React Server'},
	// 	];
	// }
}
