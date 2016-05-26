import {Component} from "react";

export default class TheFold extends Component {
	render() {
		throw new Error("Something went wrong.  Trying to render the fold...");
	}
}

TheFold.defaultProps = {
	_isTheFold: true,
}

export function isTheFold(element) {
	return element && element.props && element.props._isTheFold;
}

export function markTheFold() {
	return {isTheFold:true};
}
