import {ReactServerAgent} from "react-server";

export default class ForwardPage {
	handleRoute() {
		const request = this.getRequest();
		let params = request.getQuery();
		if (params) {
			params = params.value;
		} else {
			params = 0;
		}

		//fetch some data
		this.data = ReactServerAgent.get('/data/delay?ms=1000&val='+params);

		return this.data.then((res) => {
			//then depending on said data, forward to one of two pages, and pass along the data we pre-fetched
			const pageName = (res.body % 2 === 0) ? "./forwardEven" : "./forwardOdd";
			// TODO: change this to use isBrowser when that check is available.
			if (typeof window !== 'undefined') {
				return require.ensure([pageName], () => {
					return {
						page: require(pageName).default,
					};
				});
			} else {
				return {
					page: require(pageName).default,
				};
			}
		});
	}

	getElements() {
		return <div>boop</div>;
	}
}

