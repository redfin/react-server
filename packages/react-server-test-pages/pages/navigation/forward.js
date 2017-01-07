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
			if (res.body % 2 === 0) {
				if (typeof window !== 'undefined') { //would be nice if this is `process.env.isServer`
					return require.ensure(["./forwardEven"], () => {
						return {
							page: require("./forwardEven").default,
						};
					});
				} else {
					return {
						page: require("./forwardEven").default,
					};
				}
			} else {
				if (typeof window !== 'undefined') { //would be nice if this is `process.env.isServer`
					return require.ensure(["./forwardOdd"], () => {
						return {
							page: require("./forwardOdd").default,
						};
					});
				} else {
					return {
						page: require("./forwardOdd").default,
					};
				}
			}
		});
	}

	getElements() {
		return <div>boop</div>;
	}
}

