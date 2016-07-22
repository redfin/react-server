import React from 'react';
import {Link} from 'react-server';
import SvgLogo from './assets/SvgLogo';
import './Header.less';

export default class Header extends React.Component {
	render () {
		return (
			<header className="Header">
				<Link className="header-logo" path="/">
					<SvgLogo /> React Server
				</Link>
				<nav className="header-nav">
					<ul>
						<li><Link path="/docs">Docs</Link></li>
						<li><a target="_blank" href="https://slack.react-server.io/">Slack</a></li>
						<li><a target="_blank" href="https://github.com/redfin/react-server">GitHub</a></li>
					</ul>
				</nav>
			</header>
		);
	}
}
