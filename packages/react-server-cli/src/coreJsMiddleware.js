
module.exports = function(pathToStatic) {
	return class CoreJsMiddleware {
		getSystemScripts(next) {
			const routeName = this.getRequest().getRouteName(); 
			const baseUrl = pathToStatic || "/";
			return [
				`${baseUrl}${routeName}.bundle.js`, 
				{
					type: "text/javascript", 
					text: baseUrl ? `
						if (typeof window !== "undefined" && window.__setReactServerBase) {
							window.__setReactServerBase(${JSON.stringify(baseUrl)});
						}` : ""
				},
				...next()
			];
		}
	}
}