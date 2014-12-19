function isArray(it){
	// summary:
	//		Return true if it is an Array.
	//		Does not work on Arrays created in other windows.
	// it: anything
	//		Item to test.
	return it && (it instanceof Array || typeof it == "array"); // Boolean
}

function isFunction(it){
	// summary:
	//		Return true if it is a Function
	// it: anything
	//		Item to test.
	return Object.prototype.toString.call(it) === "[object Function]";
}

function isObject(it){
	// summary:
	//		Returns true if it is a JavaScript object (or an Array, a Function
	//		or null)
	// it: anything
	//		Item to test.
	return it !== undefined &&
		(it === null || typeof it == "object" || isArray(it) || isFunction(it)); // Boolean
}


module.exports = class ObjectGraph {
	constructor (data, creationCallback) {
		this._types = data.__types;
		this._global_attribute_names = data.__att_names;
		
		var globalIds = {};

		// It's sometimes the case (see CFDR annd DealRoomController.java) that ObjectGraph is 
		// used to deserialize data that has been serialized using a hybrid of ModelFactoryBuilder-style
		// serializations and straight-up GSON serializations.  To allow the latter to deserialize properly,
		// we simply return "data" in the case that a __root cannot be detected.
		if (data.__root == null) {
			this._root = data;
		} else {
			this._root = this._recursiveHydrate(data.__root, globalIds, creationCallback);
		}
		this._recursiveResolve(this._root, globalIds, creationCallback);
	}
	
	getRoot () { 
		return this._root;
	}
			
	// this method takes in the raw JSON object tree and returns a "hydrated" version of the tree.  note that the 
	// tree passed in is NOT modified; a parallel tree is created.  every object and array in the original is 
	// translated to the result.  objects that have a __type are instantiated using that constructor.  $ref references
	// are not resolved, but all of the global ids are added to globalIds, which is a map of id to object -sra.
	_recursiveHydrate (node, globalIds, creationCallback) {
		if (node == null) {
			// If null, no need to do anything. -shahaf.
			return node;
		} else if (isArray(node)) {
			// arrays we just copy over into a new array, but we call hydrate on each of their members -sra.
			var newArray = node.map(item => {
				return this._recursiveHydrate(item, globalIds, creationCallback);
			});
			return newArray;
		} else if (isObject(node)) {
			// for objects, we copy all the values over into newNodeData, then if there's a type,
			// we hydrate the type with newNodeData.  if not, we just use newNodeData.
			var newNodeData = {};
			var result = {};					
			var globalId;
			
			//MES- Untyped objects have attributes "directly" mapped into them.  Typed objects can ALSO have 
			//	have "directly" mapped attributes (if the type is "extended" with additional information.)
			for (var name in node) {
				//MES- Store the global ID, if that's what we found
				if (name === '__g_id') {
					globalId = node[name];
				}
				//MES- Ignore the other special "typed" fields
				else if (name === '__t_idx' || name === '__atts') {
					//MES- Ignore
				}
				else {
					//MES- This is an att we care about, tack it on.
					newNodeData[name] = this._recursiveHydrate(node[name], globalIds, creationCallback);
				}
			}

			//MES- Is this object typed?  Typed objects are rehydrated based on an array of attribute values.
			if (undefined !== node.__t_idx) {
				//MES- Typed!
				var typeIdx = parseInt(node.__t_idx);
				var jsType = this._types[typeIdx];
				var childNode = node.__atts;
				
				var numChildren = childNode.length;
				var typeFields = this._global_attribute_names[typeIdx];
				for (var i = 0; i < numChildren; ++i) {
					var fieldName = typeFields[i];
					newNodeData[fieldName] = this._recursiveHydrate(childNode[i], globalIds, creationCallback);
				}

				// all of our children have been hydrated; time to hydrate ourself -sra.
				var jsConstructor = null; //lang.getObject(jsType); //NSS TODO - disabled the object constructor thing here.
				/*if (!jsConstructor) {
				            // for dojo 1.8/AMD-style modules. This will failr if it hasn't been required by something else already.
					try {
					    jsConstructor = require(jsType.replace(/\./g, "\/")); // convert to AMD module definition by swapping out '.' for '/'
					} catch(e) {
						// error is printed out in next line
						jsConstructor = null;
					}
				}
				if (!jsConstructor) {
				         console.error("The type '" + jsType + "' could not be instantiated.  Have you dojo.required it?");
				}
				
				result = new jsConstructor(newNodeData);*/
				result = newNodeData;
				
				if (typeof(creationCallback) === "function") {
					// Call back about the creation
					creationCallback(result);
				}
			} else {
				result = newNodeData;
			}
			
			// now if there was a globalId, map it to the hydrated object -sra.
			if (globalId) {
				globalIds[globalId] = result;
			}
			return result;
		} else {
			// not an object or an array, not necessary to do anything. -sra.
			return node;
		}
	}
	
	// this method recursively walks an object tree and resolves $ref references.  it acts on the object graph
	// in place.  note that it will only work correctly if the object graph is currently in tree form; that is,
	// it has no cycles in the graph yet. note that $ref objects that are inherited properties will not be resolved,
	// but this shouldn't be a problem for us -sra.
	_recursiveResolve (node, globalIds) {
		if (null === node) {
			return;
		}
		
		if (isArray(node)) {
			// for arrays, just resolve each item.  if the element is a reference, resolve it; otherwise,
			// call recursively. -sra.
			for (var i = 0; i < node.length; i++) {
				var item = node[i];
				if (null != item && isObject(item) && item["$ref"] && globalIds[item["$ref"]]) {
					// the item is a reference object.  resolve it. -sra.
					node[i] = globalIds[item["$ref"]];
				} else {
					// the item is another object; time to go recursive. note that we don't have
					// to put the result back into the array; we just resolve it in place. -sra.
					this._recursiveResolve(item, globalIds);
				}
			}
		} else if (isObject(node)) {
			
			// for objects, resolve each property of the object.  if the property is a reference object, resolve it;
			// otherwise call recursively. -sra.
			for (var name in node) {
				// as an optimization, we only resolve direct properties. if we start using objects with 
				// inheritance chains and assign values on a prototype, then we should reconsider this. 
				// i doubt we will ever put object references onto prototypes, however. -sra.
				// RLG: skip fields starting with _Resettable, as they're not really fields on the object
				if (/^_Resettable.*/.test(name) || !node.hasOwnProperty(name)) {
					continue;
				}

				var value = node[name];
				if (null === value || isFunction(value)) {
					continue;
				}
				if (isObject(value) && value["$ref"] && globalIds[value["$ref"]]) {
					// the value is a reference object.  resolve it. -sra.
					node[name] = globalIds[value["$ref"]];
					
					/*if (isFunction(node.isInstanceOf) && node.isInstanceOf(_Resettable)) {
						// if we're a _Resettable, update the reset data for property on the object
						node._Resettable_resetData[name] = node[name];
					}*/
					
				} else if (isArray(value) || isObject(value)){
					// the value is another object; time to go recursive. note that we don't have
					// to assign to node[name]; we just resolve it in place. -sra.
					this._recursiveResolve(value, globalIds);
					
					// in this case, we're not changing the reference to the object, so we don't need to update
					// _Resettable_resetData, since it only holds references
				}
			}
		}
	}
}
