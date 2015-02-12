class ScriptMiddleware {

	getScripts(next) {
		return ["//localhost:8769/rollups/rollup.js"];
	}
}

module.exports = ScriptMiddleware;