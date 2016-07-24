import React from 'react';
import HomepageBody from '../components/homepage-body';
import './homepage.less';

export default class Homepage {

	getTitle() {
		return "React Server";
	}

	getElements() {
		return (
			<div className="homepage">
				<HomepageBody />
			</div>
		);
	}
}
