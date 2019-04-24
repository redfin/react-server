/* eslint-disable react/react-in-jsx-scope */

import {Component} from "react";
import {RootElement} from "react-server";
import Q from "q";
import PropTypes from "prop-types";

class TurnGreen extends Component {
	componentDidMount() {
		this.setState({color: "green"});
	}
	render() {
		const {color} = this.state || {};
		return <div style={{backgroundColor: color || "red"}}>{this.props.children}</div>;
	}
}
TurnGreen.propTypes = {
	children: PropTypes.node,
};

export default class RootOrderPage {
	handleRoute(next) {
		this.first = this.second = Q();

		if (typeof window !== "undefined") {
			this.first = Q.delay(1000);
		}

		return next();
	}
	getElements() {
		return [
			<RootElement key={0} when={this.first}>
				<TurnGreen>This should turn green second</TurnGreen>
			</RootElement>,
			<RootElement key={1} when={this.second}>
				<TurnGreen>This should turn green first</TurnGreen>
			</RootElement>,
		]
	}
}
