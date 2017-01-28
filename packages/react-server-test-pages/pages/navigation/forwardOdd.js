import {ReactServerAgent, RootElement} from "react-server";

const Odd = ({body}) => <div className="odd">Hey look I'm odd because I am {body}</div>;

export default class ForwardOddPage {
	handleRoute() {
		const request = this.getRequest();
		let params = request.getQuery();
		if (params) params = params.value;
		else params = 0;

		//fetch some data (should be from cache)
		this.data = ReactServerAgent.get('/data/delay?ms=1000&val='+params);

		return {code: 200};
	}

	getElements() {
		return [
			<RootElement when={this.data}><Odd /></RootElement>,
		];
	}
}
