import {join} from "path";
import {ReactServerAgent} from "react-server";

const URL = path => "https://raw.githubusercontent.com" + join(
	"/redfin/react-server/master", path
);

export default class DocsApi {

	setConfigValues() { return { isRawResponse: true } }

	getContentType() { return "application/json" }

	getResponseData() {
		const {path} = this.getRequest().getQuery();
		return ReactServerAgent
			.get(URL(path))
			.then(({text}) => JSON.stringify({path, text}));
	}
}
