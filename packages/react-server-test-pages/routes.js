const _ = require('lodash');

module.exports = {
	// these will be applied to every page in the site.
	middleware: [
		"./middleware/RequestToPort",
	],

	// this maps URLs to modules that export a Page class.
	routes: _.assign({
		Index: {
			path: ["/"],
			page: "./pages/index",
		},
		DataDelay: {
			path: ["/data/delay"],
			page: "./pages/data/delay",
		},
		CssEcho: {
			path: ["/data/echo-css"],
			page: "./pages/data/EchoCssPage",
		},
	}, _.reduce(require('./entrypoints'), (obj, val, key) => {
		if (!val.path) val.path = [val.entry];
		val.page = `./pages${val.entry}`;
		obj[key] = val;
		return obj;
	}, {})),
}
