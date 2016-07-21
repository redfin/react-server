import React from 'react';
import {Component, PropTypes} from 'react';
import './HeroSection.less';

export default class HeroSection extends Component {
	static getPropTypes() {
		return {
			serverVersion: PropTypes.string,
		};
	}

	render() {
		return (
			<section className="HeroSection">
				<div className="banner-content">
					<div className="banner-titles">
						<h1 className="banner-title">React Server</h1>
						<p className="banner-subtitle">Blazing fast-page load and seamless page transitions.</p>
					</div>
					<div className="banner-ctas">
						<a href="/" className="Button primary get-started-button">Get Started</a>
						<a href="/" className="Button secondary download-button">Download React Server {this.props.serverVersion}</a>
					</div>
				</div>
			</section>
		)
	}
}
