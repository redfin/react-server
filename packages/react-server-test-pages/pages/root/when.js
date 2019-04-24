/* eslint-disable react/react-in-jsx-scope */

import {ReactServerAgent, RootElement} from "react-server";

export default class RootWhenPage {
	handleRoute(next) {
		this.data = ReactServerAgent.get('/data/delay?ms=1000');

		return next();
	}
	getElements() {
		return [
			<div key={0}>Immediate</div>,
			<RootElement key={1} when={this.data}>
				<div>After one second data request</div>
			</RootElement>,
			<div key={2}>Immediate</div>,
		]
	}
}
