import React from 'react';
import {join} from "path";
import { RootContainer, RootElement } from "react-server";

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
	getElements() {
		return <RootContainer when={this.bodyPromise}>
			<RootElement when={this.contentsPromise}>
				<DocContents />
			</RootElement>
			<DocBody />
		</RootContainer>
	}
}
