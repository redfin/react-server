import React from 'react';
import {RootElement} from 'react-server';

import Header from '../components/header';
import Footer from '../components/footer';
import Error from '../components/error';

import '../styles/index.scss';

export default class NotFoundPage {
	handleRoute () {
		return {code: 404, hasDocument: true};
	}

	getElements () {
		return [
			<RootElement key={0}>
				<Header/>
			</RootElement>,
			<RootElement key={1}>
				<Error />
			</RootElement>,
			<RootElement key={2}>
				<Footer/>
			</RootElement>,
		]
	}

	getBodyClasses() {
		return ['page-body'];
	}
}
