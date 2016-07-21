import React from 'react';
import {join} from "path";
import {
	getCurrentRequestContext,
	RootContainer,
	RootElement,
} from "react-server";

import Repo from "../lib/repo";
import DocBody from "../components/doc-body";
import DocContents from "../components/doc-contents";

export default class DocsPage {
	handleRoute(next) {
		const path = this.getRequest().getRouteParams().path || "README";
		this.bodyPromise = Repo.getFile(join("/docs", `${path}.md`));
		this.contentsPromise = Repo.getContents();
		return next();
	}

	getTitle() {
		return this.contentsPromise.then(res => {
			const path = getCurrentRequestContext().getCurrentPath()
				.replace("/docs/", "");
			return (res.contents.reduce((page, section) => (
				page || section.pages.find(page => page.path === path)
			), null) || {name: "React Server Documentation"}).name;
		});
	}

	getElements() {
		return <RootContainer className='rootContent' when={this.bodyPromise}>
			<RootElement when={this.contentsPromise}>
				<DocContents />
			</RootElement>
			<DocBody />
		</RootContainer>
	}
}
