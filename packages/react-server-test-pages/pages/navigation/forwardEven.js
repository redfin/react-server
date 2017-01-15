import {ReactServerAgent, RootElement} from "react-server";

const Even = ({body}) => <div className="even">Hey look I'm even because I am {body}</div>;

export default class ForwardEvenPage {
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
			<RootElement when={this.data}><Even /></RootElement>,
		];
	}
}
