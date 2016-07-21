import Repo from "../lib/repo";

export default class ContentsApi {

	setConfigValues() { return { isRawResponse: true } }

	getContentType() { return "application/json" }

	getResponseData() {
		return Repo.provideFile("/docs/_contents.json");
	}
}
