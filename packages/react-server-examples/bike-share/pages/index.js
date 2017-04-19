import React from 'react';
import {ReactServerAgent, RootElement, TheFold, logging} from 'react-server';
import NetworkList from '../components/network-list';
import Header from '../components/header';
import Footer from '../components/footer';
import '../styles/index.scss';

const logger = logging.getLogger(__LOGGER__);

export default class IndexPage {
	handleRoute(next) {
		logger.info('handling index');
		this.data = ReactServerAgent.get('/api/networks').then(d => d.body);
		return next();
	}

	getTitle() {
		return 'React Server Bike Share';
	}

	getElements() {
		return [
			<RootElement>
				<Header/>
			</RootElement>,
			<RootElement when={this.data}>
				<NetworkList/>
			</RootElement>,
			<TheFold/>,
			<RootElement>
				<Footer/>
			</RootElement>,
		];
	}

	getMetaTags() {
		return [
			{charset: 'utf8'},
			{name: 'description', content: 'Bike share availability by city, powered by React Server'},
			{generator: 'React Server'},
			{keywords: 'React Server bike share'},
		];
	}

	getBodyClasses() {
		return ['page-body'];
	}
}
