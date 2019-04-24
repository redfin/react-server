/* eslint-disable react/react-in-jsx-scope */

import {
	ReactServerAgent,
	RootContainer,
	RootElement,
	TheFold,
	Link,
} from "react-server";

export default class RootWhenPage {
	handleRoute() {
		this.data = ReactServerAgent.get('/data/delay?ms=200&big=10000')
			.then(res => res.body);
		const {jsBelowTheFold} = this.getRequest().getQuery();
		return {code: 200, jsBelowTheFold};
	}
	getElements() {
		return [
			<RootContainer key={0} when={this.data}>
				<div>One</div>
			</RootContainer>,
			<RootElement key={1} when={this.data}><div>Two</div></RootElement>,
			<RootContainer key={2}>
				<div>Three - there should be script tags starting from right after me.</div>
				<TheFold />
				<RootElement when={this.data}><div>Four</div></RootElement>
			</RootContainer>,
			<div key={3}>Five</div>,
			<div key={4}>
				<Link path={"/root/aboveTheFold"}>JS in HEAD</Link> |
				<Link path={"/root/aboveThefold?jsBelowTheFold=1"}>JS below the fold</Link>
			</div>,
		]
	}
}
