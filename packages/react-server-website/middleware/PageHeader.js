import React from 'react';
import Header from '../components/Header';

export default class PageHeader extends React.Component {

	getElements(next) {
		var elements = [];

		// skip adding header for fragments
		if (this.getConfig('isFragment')) {
			return next();
		}

		elements.push(
			<Header />
		)


		return elements.concat(next());
	}

}
