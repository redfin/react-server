import React from 'react';
import {Link} from 'react-server';

import './Header.less';

export default class Header extends React.Component {
	render () {
		return (
			<header>
				<Link className="header-logo" path="/">
					React Server
				</Link>
				<nav className="header-nav">
					<ul>
						<li><Link path="/docs/README">Docs</Link></li>
						<li><Link path="/api">API</Link></li>
						<li><Link path="https://slack.react-server.io/">Slack</Link></li>
						<li><Link path="https://github.com/redfin/react-server">GitHub</Link></li>
					</ul>
				</nav>
			</header>
		);
	}
}
