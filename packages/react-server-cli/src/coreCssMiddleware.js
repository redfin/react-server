export default (pathToStatic, entryManifest) => {
	return class CoreCssMiddleware {
		getHeadStylesheets(next) {
			const routeName = this.getRequest().getRouteName();
			const baseUrl = pathToStatic || (typeof window !== "undefined" ? window.__reactServerBase : "/");
			const entries = entryManifest || (typeof window !== "undefined" ? window.__reactServerEntryManifest: {});

			let fileNames = [];

			if (entries && entries[routeName].length >=2) {
				// the css file is the second resource in the file array in the manifest;
				// the js file is the first.
				fileNames.push(baseUrl + entries[routeName][1]);
			} else if (!entries) {
				fileNames.push(baseUrl + routeName);
			}

			return [
				...fileNames,
				...next(),
			];
		}
	}
}
