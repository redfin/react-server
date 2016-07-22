import React from 'react';
import Content from '../components/homepage/HomepageContent';
import './homepage.less';

export default class Homepage {

	getTitle() {
		return "React Server";
	}

	getElements() {
		return (
			<div className="homepage">
				<Content />
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
