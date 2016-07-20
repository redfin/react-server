import React from 'react';
import {Component, PropTypes} from 'react';
import Markdown from '../Markdown';
import HeroSection from './HeroSection';
import GetStartedSection from './GetStartedSection.md';
import WhySection from './WhySection.md';
import ContributingSection from './ContributingSection.md';

export default class HomepageContent extends Component {
	static getPropTypes() {
		return {
			serverVersion: PropTypes.string,
		};
	}

	render() {
		return (
			<div className="HomepageContent">
				<HeroSection serverVersion={this.props.serverVersion} />
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
