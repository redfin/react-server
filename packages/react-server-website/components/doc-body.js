import PropTypes from 'prop-types';
import React from "react";
import { Component } from 'react';
import Markdown from './Markdown';

export default class DocBody extends Component {
	render() {
		return (
			<article className="DocBody">
				<Markdown source={this.props.text} reuseDom />
			</article>
		);
	}
}
DocBody.propTypes = {
	text: PropTypes.string.isRequired,
};

