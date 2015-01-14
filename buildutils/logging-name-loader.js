var REPLACE_TOKEN = /__LOGGING_NAME__/g
,   THIS_MODULE   = /(?:[^\/]+\/node_modules\/)?triton\/buildutils\/logging-name-loader\.js$/
,   BASE_PATH     = module.filename.replace(THIS_MODULE,'')

module.exports = function(source){
	return source.replace(REPLACE_TOKEN, loggingName.bind(this));
}

var loggingName = function(){
	var fn = this.resourcePath;

	if (fn.indexOf(BASE_PATH) != 0)
		throw("Unable to handle "+REPLACE_TOKEN+" for "+fn);

	return JSON.stringify(
		fn.substring(BASE_PATH.length, fn.length)
			.replace(/\.jsx?$/, '')
			.replace(/\//g,'.')
	);
}
