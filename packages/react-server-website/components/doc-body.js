import React from "react";
import {Component, PropTypes} from 'react';
import Markdown from './Markdown';

export default class DocBody extends Component {
	static getPropTypes() {
		return {
			text: PropTypes.string.isRequired,
		};
	}

	render() {
		return (
			<article className="DocBody">
				<Markdown source={this.props.text} reuseDom />
			</article>
		);
	}
}
