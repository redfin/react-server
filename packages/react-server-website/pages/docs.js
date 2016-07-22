import React from 'react';
import {join} from "path";
import {RootContainer, RootElement} from "react-server";

import Repo from "../lib/repo";
import DocTitle from "../components/doc-title";
import DocBody from "../components/doc-body";
import DocContents from "../components/doc-contents";

export default class DocsPage {
	handleRoute(next) {
		const path = this.getRequest().getRouteParams().path || "README";
		this.bodyPromise = Repo.getFile(join("/docs", `${path}.md`));
		this.contentsPromise = Repo.getContents().then(DocContents.setResponse);
		return next();
	}

	getTitle() {
		return this.contentsPromise.then(() => DocContents.activePageName());
	}

	getElements() {
		return <RootContainer className='rootContent' when={this.bodyPromise}>
			<RootElement when={this.contentsPromise}>
				<DocContents />
			</RootElement>
			{/* TODO: Set the server version dynamically. */}
			<DocTitle
				title="Test Title"
				viewSourceUrl="/"
				serverVersion="0.3.4" />
			<DocBody />
		</RootContainer>
	}
}
