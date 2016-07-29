import React from 'react';
import {ReactServerAgent, RootContainer} from 'react-server';
import SourceBody from '../components/source-body';
import PageTitle from '../components/page-title';
import SourceContents from '../components/source-contents';
import DataBundleCacheManager from '../middleware/DataBundleCache';

import './source.less';

export default class SourcePage {
	handleRoute(next) {
		const page = this.getRequest().getRouteParams().path;
		this.bodyPromise = page && ReactServerAgent.get('/api/source', {page})
			.then(({body}) => body)
		this.contentsPromise = ReactServerAgent.get('/api/source-contents')
			.then(({body}) => body)
			.then(SourceContents.setResponse)
			.then(DataBundleCacheManager.addContents.bind({}, '/source/'))
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
					<PageTitle titleProvider={SourceContents} />
				</RootContainer>
				<RootContainer className='rootContent' when={this.bodyPromise}>
					<SourceBody />
				</RootContainer>
			</RootContainer>
		);
	}
}
