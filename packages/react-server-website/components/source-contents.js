import React from "react";
import {join} from "path";
import PageNameMixin from "../lib/page-name-mixin";
import {
	Link,
	getCurrentRequestContext,
} from "react-server";

import './doc-contents.less'

const SourceContentsSection = ({name, pages}) => <div className='contentsSection'>
	<h3>{name}</h3>
	<ul>{pages.map(ContentsLink)}</ul>
</div>

const currentPath = () => getCurrentRequestContext().getCurrentPath();

const classIfActive = path => (path === currentPath())?{className:"active"}:{}

const ContentsLink = ({name, path}) => ContentsLinkWithMungedPath(
	name, join("/source", path)
)

const ContentsLinkWithMungedPath = (name, path) => <li {...classIfActive(path)}>
	<Link reuseDom bundleData path={path}>{name}</Link>
</li>

export default class SourceContents extends React.Component {
	render() {
		return <div className='DocContents'>{
			this.props.contents.map(SourceContentsSection)
		}</div>
	}
}

PageNameMixin(SourceContents, {
	prefix: "/source/",
	defaultName: "React Server Website Source",
});
