import React from "react";
import {join} from "path";
import {Link, getCurrentRequestContext} from "react-server";
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
	<Link reuseDom path={path}>{name}</Link>
</li>

export default function SourceContents({text}) {
	const {contents} = JSON.parse(text);
	return <div className='DocContents'>{contents.map(SourceContentsSection)}</div>
}
