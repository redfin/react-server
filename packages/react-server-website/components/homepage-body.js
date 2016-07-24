import React from 'react';
// import {Component} from 'react';
import Markdown from './Markdown';
import GetStartedSection from './content/HomeGetStartedSection.md';
import WhySection from './content/HomeWhySection.md';
import ContributingSection from './content/HomeContributingSection.md';
import {Link} from "react-server";

import './homepage-body.less';

const HeroSection = () => (
	<section className="HeroSection">
		<div className="banner-content">
			<div className="banner-titles">
				<h1 className="banner-title">React Server</h1>
				<p className="banner-subtitle">Blazing fast page load and seamless transitions.</p>
			</div>
			<div className="banner-ctas">
				<Link path="/docs" className="Button primary get-started-button">Get Started</Link>
				<a href="https://github.com/redfin/react-server" className="Button secondary download-button">View on GitHub</a>
			</div>
		</div>
	</section>
)

export default class HomepageBody extends React.Component {
	render() {
		return (
			<div className="HomepageContent">
				<HeroSection />
				<section className="get-started-section">
					<Markdown source={GetStartedSection} />
				</section>
				<section className="why-section">
					<Markdown source={WhySection} />
				</section>
				<section className="contributing-section">
					<Markdown source={ContributingSection} />
				</section>
			</div>
		);
	}
}
