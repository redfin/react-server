import React from 'react';

export default class HomepageBanner extends React.Component {
	render() {
		return (
			<section className="HomepageBanner">
				<div className="banner-tagline">
					<h1>React Server</h1>
					<p>Blazing fast-page load and seamless page transitions.</p>
				</div>
				<div className="banner-ctas">
					<button className="Button primary">Get Started</button>
					<button className="Button secondary">Download React Server 0.3.4</button>
				</div>
			</section>
		)
	}
}
