export default (pathToStatic) => {
	return class CoreJsMiddleware {
		getSystemScripts(next) {
			// hook for integration tests to turn off client rendering and just test
			// server rendering.
			if (this.getRequest().getQuery()._debug_no_system_scripts) {
				return [];
			}

			const routeName = this.getRequest().getRouteName();
			const baseUrl = pathToStatic || "/";
			return [
				`${baseUrl}common.js`,
				`${baseUrl}${routeName}.bundle.js`,
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
