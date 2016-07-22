import React from 'react';
import {ReactServerAgent, RootContainer, RootElement} from 'react-server';
import Docco from '../components/Docco';
import Footer from '../components/Footer';
import SourceContents from '../components/source-contents';

export default class SourcePage {
	handleRoute(next) {
		const page = this.getRequest().getRouteParams().path || 'routes.html';
		this.bodyPromise = ReactServerAgent.get('/api/source', {page});
		this.contentsPromise = ReactServerAgent.get('/api/source-contents')
			.then(({body}) => body)
			.then(SourceContents.setResponse)
		return next();
	}

	getTitle() {
		return this.contentsPromise
			.then(() => `Source of ${SourceContents.activePageName()}`);
	}

	getElements() {
		return (
			<RootContainer className='rootContent' when={this.bodyPromise}>
				<RootElement when={this.contentsPromise}>
					<SourceContents />
				</RootElement>
				<Docco />
				<Footer/>
			</RootContainer>
		);
	}
}
