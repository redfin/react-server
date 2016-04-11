export default (pathToStatic, manifest = typeof window !== "undefined" && window && window.__rsAppManifest) => {
	return class CoreJsMiddleware {
		getSystemScripts(next) {
			const routeName = this.getRequest().getRouteName();
			const baseUrl = pathToStatic || "/";
			return [
				`${baseUrl}${manifest.entries.common}`,
				`${baseUrl}${manifest.entries[routeName]}`,
				{
					type: "text/javascript",
					text: `window.webpackManifest = eval(${JSON.stringify(manifest.chunks)});`,
				},
				{
					type: "text/javascript",
					text: baseUrl ? `
						if (typeof window !== "undefined" && window.__setReactServerBase) {
							window.__setReactServerBase(${JSON.stringify(baseUrl)});
						}` : "",
				},
				...next(),
			];
		}
	}
}
