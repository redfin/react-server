/**
 * Wrapper class around RLS-scoped ReactServerAgent plugins to avoid
 * a circular dependency between ReactServerAgent and ReactServerAgent/Request.
 *
 * Note: It's possible that this module shouldn't exist at all. ReactServerAgent
 * plugins maybe shouldn't be request-scoped; they could be set statically,
 * and get their data from RLS if they wanted, instead. i.e., store something
 * in RLS, then have the plugin retrieve it, and that way the code being
 * executed is the same for _all_ requests)
 */

var RLS = require('../util/RequestLocalStorage').getNamespace()
;

// Simple wrapper around an array the implements the
// API we want for adding/getting plugins
class PluginsHolder {

	constructor () {
		this.plugins = [];
	}

	asArray () {
		// return a copy of the plugins array so that
		// the returned array can't change underneath
		// the caller
		return [].concat(this.plugins);
	}

	add (plugin) {
		this.plugins.push(plugin);
	}

}

function getPlugins (pluginType) {
	return (RLS()[pluginType] || (RLS()[pluginType] = new PluginsHolder()));
}


module.exports = {
	forRequest:  getPlugins.bind(null, "request"),
	forResponse: getPlugins.bind(null, "response"),
};
