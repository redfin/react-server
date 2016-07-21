import React from "react";
import {join} from "path";
import {Link, getCurrentRequestContext} from "react-server";

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
	return <div>{contents.map(ContentsSection)}</div>
}
