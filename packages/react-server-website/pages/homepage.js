import React from 'react';
import HomepageBody from '../components/homepage-body';
import './homepage.less';

export default class Homepage {

	getTitle() {
		return "React Server - Fast Server and Client Side Rendering";
	}

	getElements() {
		return (
			<div className="homepage">
				<HomepageBody />
			</div>
		);
	}
}
