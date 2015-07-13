/**
 * Utilities related to TritonAgent
 */
module.exports = {

	// TODO: this is probably provided by underscore.js
	mixin (to, from) {
		Object.keys(from).forEach( headerName => to[headerName] = from[headerName] );
		return to;
	}

}