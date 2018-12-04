import React, { Component } from 'react';
import {logging} from 'react-server';

const logger = logging.getLogger(__LOGGER__);

export default class Body extends Component {
	constructor(props) {
		super(props);
		this.increment = () => {
			this.setState({exclamationCount: this.state.exclamationCount + 1});
		}

		this.state = {
			exclamationCount: 0,
		};
	}

	componentDidMount() {
		logger.info("body rendered");
	}

	render() {
		return (
			<div className="body">
				<h2>Hello, World{"!".repeat(this.state.exclamationCount)}</h2>
				<button onClick={this.increment}>Get More Excited!</button>
			</div>
		);
	}
}
