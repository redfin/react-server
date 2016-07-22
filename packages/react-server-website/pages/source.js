import React from 'react';
import {ReactServerAgent, RootContainer} from 'react-server';
import Docco from '../components/Docco';
import DocTitle from '../components/doc-title';
import SourceContents from '../components/source-contents';

import './source.less';

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
			<RootContainer className='SourcePage'>
				<RootContainer when={this.contentsPromise}>
					<SourceContents />
					<DocTitle titleProvider={SourceContents} />
				</RootContainer>
				<RootContainer className='rootContent' when={this.bodyPromise}>
					<Docco />
				</RootContainer>
			</RootContainer>
		);
	}
}
