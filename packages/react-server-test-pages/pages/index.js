import entrypoints from "../entrypoints";
import _ from "lodash";

export default class IndexPage {
	getElements() {
		return <div>
			<h1>Entrypoints:</h1>
			<ul>{_.map(entrypoints, (val, key) => <li>
				<a href={val.entry}>{val.description||key}</a>
			</li>)}</ul>
		</div>
	}
}
