import { ReactServerAgent, RootContainer, RootElement } from "react-server";
import "./colors/red.scss";
import "./colors/green.scss";

const elements = [];
/**
* This page is a smoke test to determine whether or not large data requests in
* a page are a performance bottleneck for react-server. It performs a hundred large data
* requests before returning a simple message. Metrics are created in the browser's console
* related to performance metrics (see react-server.core.ClientController).
*/
export default class LargeDataRequestsPage {

	handleRoute() {
		//Reset elements, then perform one hundred large, local data requests before returning
		elements.length = 0;
		for (var i = 1; i <= 100; i++) {
			let current = i;
			let promise = ReactServerAgent.get('/data/delay')
				.query({ big: 10000 })
				.then(response => response.body);
			elements.push(<RootElement when={promise}><div>10K Data request number {current} complete.</div></RootElement>);
		}
		return { code: 200 };
	}

	getElements() {
		return [
			<div className="red-thing">Data requests starting...</div>,
			<RootContainer>
				{elements}
			</RootContainer>,
			<div className="green-thing">Content should be above me.</div>,
		];
	}
}
