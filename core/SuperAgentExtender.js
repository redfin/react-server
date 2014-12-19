/**
 * SuperAgentExtender.useSquigglyJson() will modify superagent's
 * parser for the application/json content type to strip off leading '{}&&',
 * which we use in our CommentFilteredJSONView responses
 */

var superagent = require('superagent'),
	debug = require('debug')('rf:SuperAgentExtender');

function parseSquigglyJson(value) {
	if (/^{}&&/.test(value)) {
		value = value.substr(4);
	}
	return JSON.parse(value);
}

module.exports = {

	useSquigglyJson: function useSquigglyJson() {

		debug('Configuring SuperAgent to allow parsing of response bodies using squiggly json')

		if (SERVER_SIDE) {

			superagent.parse['application/json'] = function(res, fn){
				res.text = '';
				res.setEncoding('utf8');
				res.on('data', function(chunk){ res.text += chunk; });
				res.on('end', function(){
					
					try {
						fn(null, parseSquigglyJson(res.text));
					} catch (err) {
						fn(err);
					}
				});
			};

		} else {

			// CLIENT_SIDE
			superagent.parse['application/json'] = function (str) {
				return parseSquigglyJson(str);
			}

		}

	}
};
