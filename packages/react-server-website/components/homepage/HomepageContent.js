import React from 'react';
import {Component} from 'react';
import Markdown from '../Markdown';
import HeroSection from './HeroSection';
import GetStartedSection from './GetStartedSection.md';
import WhySection from './WhySection.md';
import ContributingSection from './ContributingSection.md';

export default class HomepageContent extends Component {
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
