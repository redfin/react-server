import React from 'react';
import {Link, getCurrentRequestContext} from "react-server";
import SvgLogo from './assets/SvgLogo';
import './Header.less';

const links = [
	{
		label: "Docs",
		path: "/docs",
		internal: true,
	},
	{
		label: "Slack",
		path: "https://slack.react-server.io/",
		internal: false,
	},
	{
		label: "GitHub",
		path: "https://github.com/redfin/react-server",
		internal: false,
	},
]

const HeaderLink = ({label, path, internal}) => {
	if (internal) {
		return <li {...classIfActive(path, internal)}><Link reuseDom path={path}>{label}</Link></li>
	} else {
		return <li {...classIfActive(path, internal)}><a target="_blank" href={path}>{label}</a></li>
	}
}

const currentPath = () => getCurrentRequestContext().getCurrentPath();
const classIfActive = (path, internal) => (path.split("/")[1] === currentPath().split("/")[1]) && internal ? {className:"active"}:{}


export default class Header extends React.Component {
	render () {
		return (
			<header className="Header">
				<Link reuseDom className="header-logo" path="/">
					<SvgLogo />React Server
				</Link>
				<nav className="header-nav">
					<ul>
						{links.map(HeaderLink)}
					</ul>
				</nav>
			</header>
		);
	}
}
