import {ReactServerAgent, RootContainer, RootElement} from "react-server"; // eslint-disable-line

export default class RootWhenPage {
	handleRoute(next) {
		this.data = ReactServerAgent.get('/data/delay?ms=200');
		return next();
	}
	getElements() {
		return [
			<RootContainer>
				<div>One</div>
			</RootContainer>,
			<RootElement when={this.data}><div>Two</div></RootElement>,
			<RootContainer>
				<div>Three</div>
				<RootElement when={this.data}><div>Four</div></RootElement>
			</RootContainer>,
			<div>Five</div>,
		]
	}

	getAboveTheFoldCount() {
		return 3;
	}
}
