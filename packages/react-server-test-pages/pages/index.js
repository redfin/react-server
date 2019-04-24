/* eslint-disable react/react-in-jsx-scope */

import entrypoints from "../entrypoints";
import _ from "lodash";

export default class IndexPage {
	getElements() {
		return <div>
			<h1>Entrypoints:</h1>
			<ul>{_.map(entrypoints, (val, key) => <li key={key}>
				<a href={val.entry}>{val.description||key}</a>
			</li>)}</ul>
			<h2>Homepage Aliases:</h2>
			<p>This tests routes with arrays of paths</p>
			<ul>
				<li><a href="/foo">foo</a></li>
				<li><a href="/bar">bar</a></li>
			</ul>
		</div>
	}
}
