import PropTypes from 'prop-types';
import React from 'react';
import { Component } from 'react';
import './page-title.less';

export default class PageTitle extends Component {
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
			<div className="PageTitle">
				<div className="rootContent">
					<h1 className="title">{this.props.titleProvider.activePageName()}</h1>
					{ctas}
				</div>
			</div>
		);
	}
}
PageTitle.propTypes = {
	viewSourceUrl: PropTypes.string,
	serverVersion: PropTypes.string,
	titleProvider: PropTypes.object,
};

