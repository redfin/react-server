var RequestLocalStorage = require('request-local-storage');
var Promise = require('bluebird');

RequestLocalStorage.patch(require('cls-bluebird'));

// Unfortunately `cls-bluebird` doesn't go far enough, and the maintainer
// doesn't seem to be receptive to patches.  There's been a PR open with a
// similar patch since 2014.  Not going to wait on that.
//
//    https://github.com/TimBeyer/cls-bluebird/pull/1
//
RequestLocalStorage.patch(ns => {

	const proto = Object.getPrototypeOf(Promise._async);
	const invoke = proto.invoke;

	proto.invoke = function(fn, receiver, arg) {
		if (typeof fn === 'function') fn = ns.bind(fn);

		return invoke.call(this, fn, receiver, arg);
	}
});

module.exports = RequestLocalStorage;
