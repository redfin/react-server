import React from "react";
import {join} from "path";
import PageNameMixin from "../lib/page-name-mixin";
import {
	Link,
	getCurrentRequestContext,
} from "react-server";

import SvgDropdown from './assets/SvgDropdown';

import './doc-contents.less'
import PropTypes from "prop-types";

const currentPath = () => getCurrentRequestContext().getCurrentPath();

const classIfActive = path => (path === currentPath())?{className:"active"}:{}

const ContentsLinkWithMungedPath = (name, path) => <li {...classIfActive(path)}>
	<Link reuseDom bundleData path={path}>{name}</Link>
</li>;

const ContentsLink = ({name, path}) => ContentsLinkWithMungedPath(
	name, join("/docs", path)
);

const ContentsSection = ({name, pages}) => (
	<div className='contentsSection'>
		<h3>{name}</h3>
		<ul>{pages.map(ContentsLink)}</ul>
	</div>
);
ContentsSection.propTypes = {
	name: PropTypes.string,
	pages: PropTypes.array.isRequired,
};

export default class DocContents extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			menuOpen: false,
		};
	}

	componentDidMount() {
		getCurrentRequestContext().navigator.on("loadComplete", this.closeMenu.bind(this));
	}

	render() {
		return <div className={'DocContents ' + (this.state.menuOpen ? 'menuOpen' : '')}>
			<h2 className='contentsActivePage' onClick={this.toggleMenuOpen.bind(this)}>
				{DocContents.activePageName()} <SvgDropdown />
			</h2>
			<div className="contentsSections">{
				this.props.contents.map(ContentsSection)
			}</div>
		</div>
	}

	toggleMenuOpen() {
		console.log("MENUOPEN: ",this.state.menuOpen); // eslint-disable-line no-console
		this.setState( {menuOpen: !this.state.menuOpen} );
	}

	closeMenu() {
		this.setState( {menuOpen: false} );
	}
}
DocContents.propTypes = {
	contents: PropTypes.array.isRequired,
};

PageNameMixin(DocContents, {
	prefix: "/docs/",
	defaultName: "React Server Documentation",
});
