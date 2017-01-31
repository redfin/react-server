import React from 'react';
import {ReactServerAgent, RootElement, logging, TheFold} from 'react-server';
import NetworkCard from '../components/network-card';
import StationList from '../components/station-list';
import Header from '../components/header';
import Footer from '../components/footer';
import '../styles/network.scss';

const logger = logging.getLogger(__LOGGER__);

export default class NetworkPage {
	handleRoute(next) {
		this.network = this.getRequest().getQuery().network;
		const url = `/api/networks/${this.network}`;

		logger.info(`rendering network page for network ${this.network}`);
		logger.info(`getting data from url ${url}`);

		this.data = ReactServerAgent.get(url).then(d => d.body.network);
		return next();
	}

	getTitle() {
		return this.network;
	}

	getElements() {
		return [
			<RootElement key={0}>
				<Header/>
			</RootElement>,
			<RootElement when={this.data} key={1}>
				<NetworkCard/>
			</RootElement>,
			<TheFold key={2}/>,
			<RootElement when={this.data} key={3}>
				<StationList/>
			</RootElement>,
			<RootElement key={4}>
				<Footer/>
			</RootElement>,
		];
	}

	getMetaTags() {
		return [
			{charset: 'utf8'},
			{name: 'description', content: `Bike share availability in ${this.network}, powered by React Server`},
			{generator: 'React Server'},
			{keywords: 'React Server bike share'},
		];
	}

	getAboveTheFoldCount() {
		return 2;
	}

	getBodyClasses() {
		return ['page-body'];
	}
}
