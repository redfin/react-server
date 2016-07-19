import React from 'react';
import ReactMarkdown from 'react-markdown';
import {logging} from 'react-server';
import css from './hello-world.css';

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

				<ReactMarkdown source={ this.props.text } />
			</div>
		);
	}
}
