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

			if (manifest.cssChunksByName.common) {
				fileNames.push(baseUrl + manifest.cssChunksByName.common);
			}

			if (manifest.cssChunksByName[routeName]) {
				fileNames.push(baseUrl + manifest.cssChunksByName[routeName]);
			}

			return [
				...fileNames,
				...next(),
			];
		}
	}
}
