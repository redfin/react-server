export default (pathToStatic, manifest) => {
	return class CoreCssMiddleware {
		getHeadStylesheets(next) {
			const routeName = this.getRequest().getRouteName();
			const baseUrl = pathToStatic || (typeof window !== "undefined" ? window.__reactServerBase : "/");
			manifest = manifest || (typeof window !== "undefined" ? window.__reactServerManifest: {});

			if (!manifest || !manifest.cssChunksByName) {
				throw new Error("No webpack manifest found while trying to find CSS files.");
			}

			const fileNames = [];
			if (manifest.cssChunksByName[routeName]) {
				// the css file is the second resource in the file array in the manifest;
				// the js file is the first.
				fileNames.push(baseUrl + manifest.cssChunksByName[routeName]);
			}

			return [
				...fileNames,
				...next(),
			];
		}
	}
}
