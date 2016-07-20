import React from 'react';
import { RootContainer } from "react-server";

import getDocBody from "../lib/get-doc-body";
import DocBody from "../components/doc-body";

const README = "README.md";

export default class DocsPage {
	handleRoute(next) {
		const path = this.getRequest().getRouteParams().path || README;
		this.bodyPromise = getDocBody(`/docs/${path}.md`);
		return next();
	}
	getElements() {
		return <RootContainer when={this.bodyPromise}>
			<DocBody />
		</RootContainer>
	}
}
