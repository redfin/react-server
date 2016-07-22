import React from 'react';
import {Component, PropTypes} from 'react';
import './doc-title.less';

export default class DocTitle extends Component {
	static getPropTypes() {
		return {
			title: PropTypes.string.isRequired,
			viewSourceUrl: PropTypes.string,
			serverVersion: PropTypes.string,
		};
	}

	render() {
		let ctas;

		if (this.props.viewSourceUrl || this.props.serverVersion) {
			let viewSourceLink;
			let serverVersionDiv;

			if (this.props.viewSourceUrl) {
				viewSourceLink = (
					<a href={this.props.viewSourceUrl} className="Button small secondary view-source-button">{"</> View Source"}</a>
				);
			}

			if (this.props.serverVersion) {
				serverVersionDiv = (
					<div className="Button small tertiary view-source-button">Version {this.props.serverVersion}</div>
				);
			}

			ctas = (
				<div className="title-ctas">
					{viewSourceLink}
					{serverVersionDiv}
				</div>
			);
		}

		return (
			<div className="DocTitle">
				<h1 className="title">{this.props.title}</h1>
				{ctas}
			</div>
		);
	}
}
