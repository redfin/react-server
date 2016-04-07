module.exports = {
	// these will be applied to every page in the site.
	middleware: [],

	// this maps URLs to modules that export a Page class.
	routes: {
		Home: {
			path: ["/"],
			method: "get",
			page: "./pages/index",
		},
	},
}
