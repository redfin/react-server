/* eslint-disable react/react-in-jsx-scope */

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
		}`;
		return [
			<div key={0}>Before good data root</div>,
			<RootElement key={1} when={this.good}>
				<Okay />
			</RootElement>,
			<div key={2}>After good data root</div>,
			<div key={3}>Before bad data root</div>,
			<RootElement key={4} when={this.bad}>
				<Okay />
			</RootElement>,
			<div key={5}>After bad data root</div>,
			<div key={6}>Before worse data root</div>,
			<RootElement key={7} when={this.worse}>
				<Okay />
			</RootElement>,
			<div key={8}>After worse data root</div>,
			<Link key={9} path={next}>Next</Link>,
		]
	}
}
