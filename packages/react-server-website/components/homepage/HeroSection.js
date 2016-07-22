import React from 'react';
import {Component} from 'react';
import './HeroSection.less';

export default class HeroSection extends Component {
	render() {
		return (
			<section className="HeroSection">
				<div className="banner-content">
					<div className="banner-titles">
						<h1 className="banner-title">React Server</h1>
						<p className="banner-subtitle">Blazing fast-page load and seamless page transitions.</p>
					</div>
					<div className="banner-ctas">
						<a href="/docs" className="Button primary get-started-button">Get Started</a>
						<a href="https://github.com/redfin/react-server" className="Button secondary download-button">View on GitHub</a>
					</div>
				</div>
			</section>
		)
	}
}
