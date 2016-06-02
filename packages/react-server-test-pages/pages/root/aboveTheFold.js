import {
	ReactServerAgent,
	RootContainer,
	RootElement,
	TheFold,
} from "react-server";

export default class RootWhenPage {
	handleRoute(next) {
		this.data = ReactServerAgent.get('/data/delay?ms=200&big=10000')
			.then(res => res.body);
		return next();
	}
	getElements() {
		return [
			<RootContainer when={this.data}>
				<div>One</div>
			</RootContainer>,
			<RootElement when={this.data}><div>Two</div></RootElement>,
			<RootContainer>
				<div>Three - there should be script tags starting from right after me.</div>
				<TheFold />
				<RootElement when={this.data}><div>Four</div></RootElement>
			</RootContainer>,
			<div>Five</div>,
		]
	}
}
