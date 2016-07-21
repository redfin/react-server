import React from "react";
import {join} from "path";
import {Link, getCurrentRequestContext} from "react-server";
import './doc-contents.less'

const ContentsSection = ({name, pages}) => <div>
	<div>{name}</div>
	<ul>{pages.map(ContentsLink)}</ul>
</div>

const currentPath = () => getCurrentRequestContext().getCurrentPath();

const classIfActive = path => (path === currentPath())?{className:"active"}:{}

const ContentsLink = ({name, path}) => ContentsLinkWithMungedPath(
	name, join("/docs", path)
)

const ContentsLinkWithMungedPath = (name, path) => <li {...classIfActive(path)}>
	<Link reuseDom path={path}>{name}</Link>
</li>

export default function DocContents({contents}) {
	return <div className='DocContents'>{contents.map(ContentsSection)}</div>
}
