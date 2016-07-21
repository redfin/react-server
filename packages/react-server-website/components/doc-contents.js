import React from "react";
import {join} from "path";
import {Link} from "react-server";

const ContentsSection = ({name, pages}) => <div>
	<div>{name}</div>
	<ul>{pages.map(ContentsLink)}</ul>
</div>

const ContentsLink = ({name, path}) => <li>
	<Link reuseDom path={join("/docs", path)}>{name}</Link>
</li>

export default function DocContents({contents}) {
	return <div>{contents.map(ContentsSection)}</div>
}
