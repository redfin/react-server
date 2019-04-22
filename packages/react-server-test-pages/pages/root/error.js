import {ReactServerAgent, RootElement, Link} from "react-server";
import PropTypes from "prop-types";

const Okay = ({ok}) => <div>Okay: {""+ok}</div>
Okay.propTypes = {
	ok: PropTypes.number,
};

export default class RootWhenPage {
	handleRoute(next) {

		// A good data request with a response of {ok: true}
		this.good = ReactServerAgent.get('/data/delay')
			.then(res => res.body);

		// A data request to an endpoint that returns 500.
		this.bad = ReactServerAgent.get('/data/error');

		// A good data request with an error in post-processing.
		this.worse = ReactServerAgent.get('/data/delay')
			.then(() => { throw new Error("Die!") })

		return next();
	}
	getElements() {
		const next = `/root/error?page=${
			+(this.getRequest().getQuery().page||0)+1
		}`
		return [
			<div>Before good data root</div>,
			<RootElement when={this.good}>
				<Okay />
			</RootElement>,
			<div>After good data root</div>,
			<div>Before bad data root</div>,
			<RootElement when={this.bad}>
				<Okay />
			</RootElement>,
			<div>After bad data root</div>,
			<div>Before worse data root</div>,
			<RootElement when={this.worse}>
				<Okay />
			</RootElement>,
			<div>After worse data root</div>,
			<Link path={next}>Next</Link>,
		]
	}
}
