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
}
