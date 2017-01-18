import {RootElement} from "react-server"; // eslint-disable-line
import {RootProvider} from "react-server-redux"; // eslint-disable-line
import {createStore} from "redux"; // eslint-disable-line
import { connect } from 'react-redux'; // eslint-disable-line
import React from 'react'; // eslint-disable-line

function simpleReducer(state = {simpleValue: "Hello"}) {
	return state;
}

class BasicComponent extends React.Component {
	render() {
		return (<div>{this.props.simpleValue}</div>)
	}
}

BasicComponent.propTypes = {
	simpleValue: React.PropTypes.string,
}

const mapStateToProps = function(state) {
	return {
		simpleValue: state.simpleValue,
	}
}

const BasicReduxComponent = connect(mapStateToProps)(BasicComponent);

export default class RootProviderPage {
	getElements() {
		const store = createStore(simpleReducer);
		return [
			<RootProvider store={store}>
				<RootElement>
					<BasicReduxComponent></BasicReduxComponent>
				</RootElement>
				<RootElement>
					<BasicReduxComponent></BasicReduxComponent>
				</RootElement>
				<div>Basic Div</div>
			</RootProvider>,
		]
	}
}
