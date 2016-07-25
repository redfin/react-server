import Repo from "../lib/repo";

export default class DocsApi {

	setConfigValues() { return { isRawResponse: true } }

	getContentType() { return "application/json" }

	getResponseData() {
		const {path} = this.getRequest().getQuery();
		return Repo.provideFile(path)
			.then(transformLinks)
			.then(text => JSON.stringify({path, text}));
	}
}

function transformLink(match, text, path) {
	if (path.indexOf("http") !== 0) {
		if (path.indexOf("/docs") !== 0) {
			if (path.indexOf("/") === 0) {
				path = "/docs" + path;
			} else {
				path = "/docs/" + path;
			}
		}
		path = path.replace(/\.md$/, "");
	}
	return `[${text}](${path})`;
}

function transformLinks(text) {
	return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, transformLink);
}
