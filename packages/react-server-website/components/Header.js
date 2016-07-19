import React from 'react';

export default class Header extends React.Component {
	render () {
		return (
			<header>
				<div className="header-logo">
					React Server
				</div>
				<nav className="header-nav">
					<ul>
						<li><a href="/docs">Docs</a></li>
						<li><a href="https://github.com/redfin/react-server">Git Hub</a></li>
					</ul>
				</nav>
			</header>
		);
	}
}
