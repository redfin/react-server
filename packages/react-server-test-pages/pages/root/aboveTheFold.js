import {ReactServerAgent, RootContainer, RootElement} from "react-server"; // eslint-disable-line

// TODO: when we implement <TheFold/> (https://github.com/redfin/react-server/issues/161),
// update this test page to use the new API

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
				<div>Three - there should be script tags starting from right after me b/c my getAboveTheFoldCount is 3!</div>
				<RootElement when={this.data}><div>Four</div></RootElement>
			</RootContainer>,
			<div>Five</div>,
		]
	}

	getAboveTheFoldCount() {
		return 3;
	}
}
