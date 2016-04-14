export default (pathToStatic, entryManifest, chunkManifest) => {
	return class CoreJsMiddleware {
		getSystemScripts(next) {
			const routeName = this.getRequest().getRouteName();
			const baseUrl = pathToStatic || "/";

			const scripts = [];

			if (chunkManifest) {
				scripts.push({
					type: "text/javascript",
					text: `window.webpackManifest = ${JSON.stringify(chunkManifest)};`,
				});
			}

			if (entryManifest) {
				scripts.push(`${baseUrl}${entryManifest.common[0]}`);
				scripts.push(`${baseUrl}${entryManifest[routeName][0]}`);
			} else {
				scripts.push(`${baseUrl}common.js`);
				scripts.push(`${baseUrl}${routeName}.bundle.js`);
			}


			return [
				...scripts,
				{
					type: "text/javascript",
					text: baseUrl ? `
						if (typeof window !== "undefined" && window.__setReactServerBase) {
							window.__setReactServerBase(${JSON.stringify(baseUrl)});
							window.__reactServerEntryManifest = ${entryManifest ? JSON.stringify(entryManifest) : "{}"};
						}` : "",
				},
				...next(),
			];
		}
	}
}
