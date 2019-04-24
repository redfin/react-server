import PropTypes from 'prop-types';
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
		label: "Source",
		path: "/source",
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

const currentPath = () => getCurrentRequestContext().getCurrentPath();
const classIfActive = (path, internal) => (path.split("/")[1] === currentPath().split("/")[1]) && internal ? {className:"active"}:{}

const HeaderLink = ({label, path, internal}) => {
	// Internal links use Client Transitions for faster load times.
	if (internal) {
		return <li key={path} {...classIfActive(path, internal)}><Link path={path} bundleData>{label}</Link></li>
	} else {
		return <li key={path} {...classIfActive(path, internal)}><a target="_blank" rel="noopener noreferrer" href={path}>{label}</a></li>
	}
};
HeaderLink.propTypes = {
	label: PropTypes.string,
	path: PropTypes.string,
	internal: PropTypes.bool,
};

class MenuControl extends React.Component {
	render() {
		let controlContent = (<span>Menu <SvgHambut /></span>)

		if (this.props.open) {
			controlContent = (<span>Close <SvgClose /></span>)
		}

		return controlContent;
	}
}
MenuControl.propTypes = {
	open: PropTypes.bool,
};


export default class Header extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			menuOpen: false,
		};

		this.headerNav = React.createRef();
	}

	componentDidMount() {
		// Because Client Transitions will reload the content, not the page, we
		// make sure that a navigation action also closes the modal.
		// If we didn't do this, you'd wind up on a new page but still have the
		// menu open.
		getCurrentRequestContext().navigator.on( "navigateStart", this.closeMenu.bind(this) );
	}

	render () {
		return (
			<div>
				<div className="fixedHeaderSpacer"></div>
				<header className={this.state.menuOpen ? "menuOpen Header" : "Header"}>
					<Link className="header-logo" path="/">
						<SvgLogo />React Server
					</Link>

					<div className="mobileToggle" onClick={this.toggleMenuOpen.bind(this)}>
						<MenuControl open={this.state.menuOpen} />
					</div>

					<nav className="header-nav" ref={this.headerNav}>
						<ul>
							{links.map(HeaderLink)}
						</ul>
					</nav>
				</header>
			</div>
		);
	}

	closeMenu() {
		this.setState( {menuOpen: false} );
	}

	toggleMenuOpen() {
		// For mobile devices, the menu is basically a modal - it takes over the
		// whole viewport. To prevent the user from scrolling the page behind
		// the navigation menu, we prevent touchmove from firing.
		if (!this.state.menuOpen) {
			this.headerNav.addEventListener('touchmove', function(event) {
				event.preventDefault();
				event.stopPropagation();
			}, false);
		}

		this.setState( {menuOpen: !this.state.menuOpen} );
	}
}
