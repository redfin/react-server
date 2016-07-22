import React from 'react';
import {ReactServerAgent, RootContainer, RootElement} from 'react-server';
import Docco from '../components/Docco';
import Footer from '../components/Footer';
import SourceContents from '../components/source-contents';

export default class SourcePage {
	handleRoute(next) {
		const page = this.getRequest().getRouteParams().path || 'routes.html';
		this.bodyPromise = new Promise(resolve => {
			ReactServerAgent.get('/api/source', {page}).then(data => resolve(data));
		});
		this.contentsPromise = new Promise(resolve => {
			ReactServerAgent.get('/api/source-contents').then(data => resolve(data));
		});
		return next();
	}

	getTitle() {
		return this.getRequest().getRouteParams().path;
	}

	getElements() {
		return (
			<RootContainer className='rootContent' when={this.bodyPromise}>
				<RootElement when={this.contentsPromise}>
					<SourceContents />
				</RootElement>
				<Docco />
			</RootContainer>
		);
	}

	getMetaTags() {
		return [
			{charset: 'utf8'},
			{'http-equiv': 'x-ua-compatible', 'content': 'ie=edge'},
			{name: 'viewport', content: 'width=device-width, initial-scale=1'},
			{name: 'description', content: 'React Server source, powered by React Server'},
			{name: 'generator', content: 'React Server'},
		];
	}
}
