import React from 'react';
import {Link} from 'react-server';

import './Header.less';

export default class Header extends React.Component {
	render () {
		return (
			<header>
				<Link reuseDom className="header-logo" path="/">
					React Server
				</Link>
				<nav className="header-nav">
					<ul>
						<li><Link reuseDom path="/docs">Docs</Link></li>
						<li><a target="_blank" href="https://slack.react-server.io/">Slack</a></li>
						<li><a target="_blank" href="https://github.com/redfin/react-server">GitHub</a></li>
					</ul>
				</nav>
			</header>
		);
	}
}
