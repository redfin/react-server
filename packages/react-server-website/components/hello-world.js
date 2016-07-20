import React from 'react';

import Markdown from './Markdown.jsx';
import {logging} from 'react-server';
import './hello-world.less';

const logger = logging.getLogger(__LOGGER__);

export default class HelloWorld extends React.Component {
	constructor(props) {
		super(props);
		this.state = {exclamationCount: 0};
		this.handleClick = () => {
			logger.info(`Getting more excited! previously ${this.state.exclamationCount} excitements.`);
			this.setState({exclamationCount: this.state.exclamationCount + 1});
		};
	}

	render() {
		return (
			<div>
				<h2>Hello, World{'!'.repeat(this.state.exclamationCount)}</h2>
				<button onClick={this.handleClick}>Get More Excited!</button>

				<Markdown source={ this.props.text } />
			</div>
		);
	}
}
