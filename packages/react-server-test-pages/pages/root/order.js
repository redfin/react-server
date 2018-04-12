import { Component } from "react";
import { RootElement } from "react-server";
import Q from "q";

class TurnGreen extends Component {
	componentDidMount() {
		this.setState({ color: "green" });
	}
	render() {
		const { color } = this.state || {};
		return <div style={{ backgroundColor: color || "red" }}>{this.props.children}</div>;
	}
}

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
			<RootElement when={this.first}>
				<TurnGreen>This should turn green second</TurnGreen>
			</RootElement>,
			<RootElement when={this.second}>
				<TurnGreen>This should turn green first</TurnGreen>
			</RootElement>,
		]
	}
}
