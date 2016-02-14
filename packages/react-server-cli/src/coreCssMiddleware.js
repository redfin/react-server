
module.exports = function(pathToStatic) {
	return class CoreCssMiddleware {
		getHeadStylesheets(next) {
			const routeName = this.getRequest().getRouteName(); 
			const baseUrl = pathToStatic || (typeof window !== "undefined" ? window.__reactServerBase : "/");
			return [
				`${baseUrl}${routeName}.css`, 
				...next()
			];
		}
	}
}