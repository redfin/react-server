import React from "react";
import DataBundleCache from "react-server-data-bundle-cache";
import {
	Link,
	RootContainer,
} from "react-server";
import {
	GET,
	ROWS,
	PagePointer,
	RowIndex,
	RowMS,
	ClientRenderIndicator,
} from "./common";

require("./common.css");

DataBundleCache.install();

const BASE = "/navigation/data-bundle-cache";
const LINK = page => `${BASE}?page=${page}`

const BundleLink = ({row}) => <Link bundleData={true} reuseDom={true} path={LINK(row)}>Go</Link>

export default class DataBundleCachePage {
	handleRoute(next) {
		const {page} = this.getRequest().getQuery();
		this.data = ROWS.map(GET.bind({page}));

		return next();
	}
	getElements() {
		return [
			<RootContainer>
				<h1>Data Bundle Cache</h1>
			</RootContainer>,
			...this.data.map(promise => <RootContainer when={promise} className="row">
				<PagePointer />
				<RowIndex />
				<RowMS />
				<ClientRenderIndicator />
				<BundleLink />
			</RootContainer>),
		]
	}
}
