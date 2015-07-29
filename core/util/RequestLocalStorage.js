/* eslint-disable no-redeclare */

/* This module provides access to objects that are scoped to the lifespan of a
 * request.
 *
 * Use `getNamespace` to retrieve a module-level object provider.
 *
 * Note that `getNamespace` _returns a function_.  It should be called at the
 * module level.  The function that's returned must be called _for each access_.
 *
 * Example:
 *
 *   var RequestLocals = require('triton').RequestLocalStorage.getNamespace();
 *
 *   var getInstance = function(){
 *
 *     // Get a reference to _current_ request's locals.
 *     var locals = RequestLocals();
 *
 *     if (!locals.instance)
 *       locals.instance = new Instance();
 *
 *     return locals.instance;
 *   }
 *
 */

if (SERVER_SIDE){
	var key          = '_triton_request_local_storage_'
	,   cls          = require('continuation-local-storage').createNamespace(key)
	,   bind         = cls.bind.bind(cls)
	,   getContainer = () => cls.get(key)
	,   startRequest = (start) => { cls.run(() => {cls.set(key, []); start()}) }

	// Make sure our Q promises play well with continuation local storage.
	require('cls-q')(cls);
} else {
	var container    = []
	,   bind         = f  => f
	,   getContainer = () => container
	,   startRequest = () => container = []
}

var namespaces         = 0
,   getCountNamespaces = () => namespaces
,   getNamespace       = () => {

	// This will be our return value.
	var getter = (i => () => {
		var container = getContainer();
		if (!container){
			throw new Error("RLS() access outside of request!");
		}
		return container[i] || (container[i] = {});
	})(namespaces++);

	// This is guarded against old versions of node that don't provide the
	// necessary API (bamboo).
	if (SERVER_SIDE && Object.observe) {

		Object.observe(getter, changes => {

			// It's easy to make the mistake of using `RLS.foo`
			// instead of `RLS().foo`, but this is actually a very
			// bad error server-side.  It's a leak across requests.
			throw new Error(`Use of "RLS.${
				changes[0].name
			}" should be "RLS().${
				changes[0].name
			}"!`);
		});
	}

	return getter;
}

module.exports = { getNamespace, getCountNamespaces, startRequest, bind };
