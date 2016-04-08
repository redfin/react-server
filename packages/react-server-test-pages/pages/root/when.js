import {ReactServerAgent, RootElement} from "react-server"; // eslint-disable-line

export default class RootWhenPage {
	handleRoute(next) {
		this.data = ReactServerAgent.get('/data/delay?ms=1000');

		return next();
	}
	getElements() {
		return [
			<div>Immediate</div>,
			<RootElement when={this.data}>
				<div>After one second data request</div>
			</RootElement>,
			<div>Immediate</div>,
		]
	}
}
