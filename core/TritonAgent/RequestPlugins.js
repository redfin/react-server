/**
 * Wrapper class around RLS-scoped TritonAgent plugins to avoid
 * a circular dependency between TritonAgent and TritonAgent/Request.
 *
 * Note: It's possible that this module shouldn't exist at all. TritonAgent
 * plugins maybe shouldn't be request-scoped; they could be set statically,
 * and get their data from RLS if they wanted, instead. i.e., store something
 * in RLS, then have the plugin retrieve it, and that way the code being
 * executed is the same for _all_ requests)
 */

var RLS = require('../util/RequestLocalStorage').getNamespace()
;

function add (plugin) {
	get().push(plugin);
}

function get () {
	var plugins = RLS().requestPlugins;
	if (!plugins) {
		plugins = RLS().requestPlugins = [];
	}
	return plugins;
}

module.exports = { add, get };