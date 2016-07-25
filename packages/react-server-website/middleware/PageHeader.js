import React from 'react';
import Header from '../components/Header';

export default class PageHeader {
	getElements(next) {
		var elements = [];

		elements.push(
			<Header />
		)

		return elements.concat(next());
	}
}
