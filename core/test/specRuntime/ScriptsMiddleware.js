class ScriptMiddleware {

	getScripts (next) {
		return ["/rollups/rollup.js"];
	}
}

module.exports = ScriptMiddleware;
