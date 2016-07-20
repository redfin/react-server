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
					<div className="banner-tagline">
						<h1>React Server</h1>
						<p>Blazing fast-page load and seamless page transitions.</p>
					</div>
					<div className="banner-ctas">
						<button className="Button primary">Get Started</button>
						<button className="Button secondary">Download React Server {this.props.serverVersion}</button>
					</div>
				</div>
			</section>
		)
	}
}
