/* eslint-disable react/react-in-jsx-scope */

import {ReactServerAgent, RootElement} from "react-server";
import PropTypes from "prop-types";

const Odd = ({body}) => <div className="odd">Hey look I&apos;m odd because I am {body}</div>;
Odd.propTypes = {
	body: PropTypes.any,
};

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
			<RootElement key={0} when={this.data}><Odd /></RootElement>,
		];
	}
}
