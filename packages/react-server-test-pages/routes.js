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
			method: "get",
			page: "./pages/index",
		},
		DataDelay: {
			path: ["/data/delay"],
			method: "get",
			page: "./pages/data/delay",
		},
	}, _.reduce(require('./entrypoints'), (obj, val, key) => {
		if (!val.method) val.method = "get";
		if (!val.path) val.path = [val.entry];
		val.page = `./pages${val.entry}`;
		obj[key] = val;
		return obj;
	}, {})),
}
