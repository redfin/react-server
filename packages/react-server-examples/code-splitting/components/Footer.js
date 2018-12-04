import React, { Component } from 'react';
import {logging} from 'react-server';

const logger = logging.getLogger(__LOGGER__);

export default class Footer extends Component {
	constructor(props) {
		super(props);
		this.state = {
			mounted: false,
		};
	}

	componentDidMount() {
		logger.info("footer rendered");
		this.setState({
			mounted: true,
		});
	}

	render() {
		const isMounted = this.state.mounted;
		const footerText = `Footer ${isMounted ? "is loaded" : " has not been loaded"}`;
		return (
			<div className="footer">
				{footerText}
			</div>
		);
	}
}
