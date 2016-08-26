var  SuperLogger = require('winston').Transport
,	         RLS = require('../util/RequestLocalStorage').getNamespace();

// A subset of stats that are logged are not associated with requests
// or occur before the request context is initialized. Simply ignore
// those logs here.
var queue = () => {
	if (RLS.isActive()) {
		return RLS().queue || (RLS().queue = []);
	}
	else {
		return [];
	}
}

var pushToQueue = (module, lastModuleToken, key, level, msg, meta) => {
	if (RLS.isActive() && !!RLS().doLog) {
		var tuple = [
			module,
			msg,
			meta[key],
			lastModuleToken,
		];
		queue().push(tuple);
	}
}
class ResponseLogger extends SuperLogger {
	constructor(options) {
		super();
		this.name = 'ResponseLogger';
		this.level = options.level || 'debug';
		this.module = options.name;
		this.lastModuleToken  = options.name.split('.').pop();
	}

	log(level, msg, meta, callback) {
		pushToQueue(this.module, this.lastModuleToken, this.key, level, msg, meta);
		// Yield to the next log transport.
		callback(null, true);
	}
}

class TimeResponseLogger extends ResponseLogger {
	constructor(options){
		super(options);
		this.name = 'TimeResponseLogger';
		this.level = 'fast';
		this.key   = 'ms';
	}
}

class GaugeResponseLogger extends ResponseLogger {
	constructor(options){
		super(options);
		this.name = 'GaugeResponseLogger';
		this.level = 'ok';
		this.key   = 'val';
	}
}

var getTransportForGroup = function(group, opts) {
	if (group === "time") {
		return new TimeResponseLogger(opts);
	}
	else if (group === "gauge") {
		return new GaugeResponseLogger(opts);
	}
	else {
		return new ResponseLogger(opts);
	}
}

var flushLogsToResponse = function(res) {
	if (queue().length > 0) {
		res.write("<script>");
		res.write(`window.reactServerLogs = ${JSON.stringify(queue())};\n`);
		res.write("</script>");
	}
}

var setResponseLoggerPage = function(page) {
	if (RLS.isActive() && !!page) {
		RLS().doLog = page.getRequest().getQuery()._debug_output_logs;
	}
}
module.exports = {setResponseLoggerPage, flushLogsToResponse, getTransportForGroup, TimeResponseLogger, ResponseLogger};
