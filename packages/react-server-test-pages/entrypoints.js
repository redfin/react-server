// These show up on the index page (homepage).
// Your `path` must be able to handle `entry`.
// Your module must live at `pages${entry}`.
// If you don't include a `path`, it will be created for you from `entry`.
// Your method will be defaulted to "get".
// The default `description` is your route _key_.
module.exports = {
	RootAttributes: {
		entry: "/root/attributes",
		description: "Attributes on root elements and containers",
	},
	RootReuseTrim: {
		entry: "/root/reuse-trim",
		description: "Dangling nodes should be trimmed with `reuseDom`",
	},
	RootWhen: {
		entry: "/root/when",
		description: "<RootElement when={...}>",
	},
	RootError: {
		entry: "/root/error",
		description: "A data error for a root element",
	},
	AboveTheFold: {
		entry: "/root/aboveTheFold",
		description: "Above The Fold Count",
	},
	NavigationPlayground: {
		entry: "/navigation/playground",
		description: "Navigation playground",
	},
	Forwarding: {
		entry: "/navigation/forward",
		description: "Test how page forwarding works with passing data down",
	},
	StylePromises: {
		entry: "/styles/promises",
		description: "Stylesheets returned from promises",
	},
	Sass: {
		entry: "/styles/sass",
		description: "SASS styles",
	},
	NavigationDataBundleCache: {
		entry: "/navigation/data-bundle-cache",
		description: "Data bundle cache",
	},
	NavigateTo: {
		entry: "/navigation/navigateTo",
		description: "Navigate using `navigateTo()`",
	},
	ErrorLogs: {
		entry: "/error/logs",
		description: "Generate errors in the logs",
	},
	BottleneckElements: {
		entry: "/bottleneck/elements",
		description: "Test if number of elements on a page is a bottleneck",
	},
	BottleneckDataRequests: {
		entry: "/bottleneck/dataRequests",
		description: "Test if number of data requests on a page is a bottleneck",
	},
	BottleneckMiddleware: {
		entry: "/bottleneck/middleware",
		description: "Test if amount of middleware on a page is a bottleneck",
	},
}
