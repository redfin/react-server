import React from 'react';
import {Link, getCurrentRequestContext} from "react-server";

import SvgLogo from './assets/SvgLogo';
import SvgClose from './assets/SvgClose';
import SvgHambut from './assets/SvgHambut';

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
		return <li {...classIfActive(path, internal)}><Link path={path}>{label}</Link></li>
	} else {
		return <li {...classIfActive(path, internal)}><a target="_blank" href={path}>{label}</a></li>
	}
}

class MenuControl extends React.Component {
	render() {
		let controlContent = (<span>Menu <SvgHambut /></span>)

		if (this.props.open) {
			controlContent = (<span>Close <SvgClose /></span>)
		}

		return controlContent;
	}
}

const currentPath = () => getCurrentRequestContext().getCurrentPath();
const classIfActive = (path, internal) => (path.split("/")[1] === currentPath().split("/")[1]) && internal ? {className:"active"}:{}


export default class Header extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			menuOpen: false,
		};
	}

	componentDidMount() {
		getCurrentRequestContext().navigator.on( "navigateStart", this.closeMenu.bind(this) );
	}

	render () {
		return (
			<header className={this.state.menuOpen ? "menuOpen Header" : "Header"}>
				<Link className="header-logo" path="/">
					<SvgLogo />React Server
				</Link>

				<div className="mobileToggle" onClick={this.toggleMenuOpen.bind(this)}>
					<MenuControl open={this.state.menuOpen} />
				</div>

				<nav className="header-nav" ref="headerNav">
					<ul>
						{links.map(HeaderLink)}
					</ul>
				</nav>
			</header>
		);
	}

	closeMenu() {
		this.setState( {menuOpen: false} );
	}

	toggleMenuOpen() {
		if (!this.state.menuOpen) {
			this.refs.headerNav.addEventListener('touchmove', function(event) {
				event.preventDefault();
				event.stopPropagation();
			}, false);
		}

		this.setState( {menuOpen: !this.state.menuOpen} );
	}
}
