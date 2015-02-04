
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
	,   getContainer = () => cls.get(key)
	,   startRequest = (start) => { cls.run(() => {cls.set(key, []); start()}) }

	// Make sure our Q promises play well with continuation local storage.
	require('cls-q')(cls);
} else {
	var container    = []
	,   getContainer = () => container
	,   startRequest = () => container = []
}

var namespaces         = 0
,   getCountNamespaces = () => namespaces
,   getNamespace       = () => (
	(i => () => getContainer()[i] || (getContainer()[i] = {}))(namespaces++)
)

module.exports = { getNamespace, getCountNamespaces, startRequest };
