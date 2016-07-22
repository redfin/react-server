import React from 'react';
import {join} from "path";
import {RootContainer} from "react-server";

import Repo from "../lib/repo";
import DocTitle from "../components/doc-title";
import DocBody from "../components/doc-body";
import DocContents from "../components/doc-contents";
import "./docs.less";

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
		return (
			<RootContainer className='DocsPage'>
				{/* FIXME: `title` is not updating when clinking a link the doc contents. */}
				<RootContainer when={this.contentsPromise}>
					<DocContents />
					<DocTitle title={DocContents.activePageName()} />
				</RootContainer>
				<RootContainer className="rootContent" when={this.bodyPromise}>
					<DocBody />
				</RootContainer>
			</RootContainer>
		);
	}
}
