import {join} from "path";
import {ReactServerAgent} from "react-server";

const URL = path => "https://raw.githubusercontent.com" + join(
	"/redfin/react-server/master", path
);

export default class Repo {
	static getFile(path) {
		return ReactServerAgent
			.get("/api/docs", {path})
			.then(res => res.body);
	}

	static getContents() {
		return ReactServerAgent
			.get("/api/contents")
			.then(res => res.body);
	}

	static provideFile(path) {
		// TODO: Use config for this.
		if (process.env.LOCAL_DOCS) { // eslint-disable-line no-process-env
			return Promise.resolve(require(join("../../..", path)))
				.then(obj => typeof obj === "string" ? obj :JSON.stringify(obj))
		} else {
			return ReactServerAgent
				.get(URL(path))
				.then(({text}) => text)
		}
	}
}
