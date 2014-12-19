
var debug = require('debug')('rf:enums'),
	superagent = require('superagent'),
	Q = require('q');

// ADD ENUMS TO INCLUDE HERE

var enumMap = {
	Feature: 'g_feature',
	FavoritePropertyType: 'g_favoritePropertyType',
	ApiResultCode: 'g_apiResultCode'
};


/// END ADD ENUMS HERE


var _dfd = null;

var enums = {
	init: function () {
		// subsequent calls return the same dfd
		if (_dfd) return _dfd.promise;

		var dfd = _dfd = Q.defer();

		var req = superagent
			.get('/stingray/do/js/v56.0/EnumDefinitions.js');

		if (SERVER_SIDE) {
			req = req.buffer();
		}
			
		req.end( res => {

			if (!res.ok) {
				console.error(res.text);
				throw Error('Error loading EnumDefinitions on startup');
			}

			debug("Executing Hack...");

			var enumDefs = Object.keys(enumMap).reduce( (accum, key) => {
				if (accum !== "") {
					accum += ",";
				}
				return accum + key + ":" + enumMap[key];
			}, "");

			var hack = new Function(res.text + "; return {" + enumDefs + "}");

			debug("Hack Executed");

			// *copy* each loaded enum returned from our hack onto the appropriate
			// enum on the exported enums object. This allows us to reference a particular
			// enum object at require-time, but not have it filled in until a little later
			var loadedEnums = hack();

			Object.keys(loadedEnums).forEach( enumName => {
				var loadedEnum = loadedEnums[enumName];
				Object.keys(loadedEnum).forEach( enumObjectPropName => {
					enums[enumName][enumObjectPropName] = loadedEnum[enumObjectPropName];
				})
			});

			dfd.resolve();
		});

		return dfd.promise;

	}

}

// create a placeholder object on the enums export so that they can be referenced
// at module-require time. We'll fill it in when enums.init() is run
Object.keys(enumMap).forEach( key => {
	enums[key] = {};
});


module.exports = enums;
