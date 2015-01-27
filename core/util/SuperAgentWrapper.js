var superagent = require('superagent');


/**
 * SuperAgent proxy object. Used to ensure that Redfin cookies
 * are set properly when superagent is executed server-side
 */
function SuperAgentWrapper(defaultHeaders) {
	this.defaultHeaders = defaultHeaders || {};
}


// Adding a layer of indirection between SuperAgentWrapper and
// the superagent object so that when we set things on
// SuperAgentWrapper.prototype we don't actually change superagent's
// functions
var superAgentWrapperPrototype = {};
superAgentWrapperPrototype.prototype = superagent;

// SuperAgentWrapper inherits from the superagent
// object. Note that this makes it impossible for
// developers to use the low-level request(<method>, <url>)
// functionality of superagent.
SuperAgentWrapper.prototype = superAgentWrapperPrototype;

// Override specific functionality from superagent

SuperAgentWrapper.prototype.get = function (url, data, fn) {
	// we never want to pass fn, because we need to do stuff
	// to the request first
	if ('function' == typeof data) fn = data, data = null;
	var req = superagent.get.call(this, url, data);
	req.set(this.defaultHeaders);
	if (fn) req.end(fn);
	return req;
}

SuperAgentWrapper.prototype.head = function (url, data, fn){
	if ('function' == typeof data) fn = data, data = null;
	var req = superagent.head.call(this, url, data);
	req.set(this.defaultHeaders);
	if (fn) req.end(fn);
	return req;
};

SuperAgentWrapper.prototype.del = function (url, fn){
	var req = superagent.del.call(this, url, data);
	req.set(this.defaultHeaders);
	if (fn) req.end(fn);
	return req;
};

SuperAgentWrapper.prototype.patch = function (url, data, fn){
	if ('function' == typeof data) fn = data, data = null;
	var req = superagent.patch.call(this, url, data);
	req.set(this.defaultHeaders);
	if (fn) req.end(fn);
	return req;
};

SuperAgentWrapper.prototype.post = function (url, data, fn){
	if ('function' == typeof data) fn = data, data = null;
	var req = superagent.post.call(this, url, data);
	req.set(this.defaultHeaders);
	if (fn) req.end(fn);
	return req;
};

SuperAgentWrapper.prototype.put = function (url, data, fn){
  	if ('function' == typeof data) fn = data, data = null;
	var req = superagent.put.call(this, url, data);
	req.set(this.defaultHeaders);
	if (fn) req.end(fn);
	return req;
};

module.exports = SuperAgentWrapper;
