
/* This module provides access to objects that are scoped to the lifespan of
 * request.
 *
 * Use `getGlobals` for a globally shared object.
 *
 * Use `getLocals` for a module-level object.
 *
 * Note that both of these functions _return functions_.  The first function
 * (`getGlobals` or `getLocals`) should be called once per module.  The
 * function that's returned from this must be called _for each access_.
 *
 * Example (`getGlobals`):
 *
 *   var RequestGlobals = require('triton').RequestLocalStorage.getGlobals();
 *
 *   var setMyVar = function(){
 *
 *     // Stash a value in _current_ request's globals.
 *     RequestGlobals().g_myVar = 'foo';
 *   }
 *
 * Example (`getLocals`):
 *
 *   var RequestLocals = require('triton').RequestLocalStorage.getLocals();
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

} else {
	var container    = []
	,   getContainer = () => container
	,   startRequest = () => container = []
}

var getLocals = (function(){
	var i = -1;
	return () => (i++, () => getContainer()[i] || (getContainer()[i] = {}));
})();

var requestGlobals = getLocals()
,   getGlobals     = () => requestGlobals

module.exports = { getGlobals, getLocals, startRequest };
