var Q = require("q");

var PageUtil = module.exports = {
	/**
	 * This method takes in anything returns from a Page.getElements call and returns the 
	 * elements in a standardized format: an array of EarlyPromises of ReactElements.
	 */
	standardizeElements(elements) {
		var result = elements;

		// the return value could be a single element or an array. first, let's
		// make sure that it's an array.
		if (!Array.isArray(result)) {
			result = [result];
		}

		// next, ensure that all elements are EarlyPromises.
		result = result.map((element) => {
			return PageUtil.early(Q(element));
		});

		return result;
	},

	/** 
	 * Translates a normal Promise to a simple EarlyPromise. 
	 *     promise (required): the promise to translate.
	 *     pendingValue (optional): the value to be returned by get while the promise is pending.
	 *         defaults to null if not present.
	 */
	early(promise, pendingValue) {
		// if it's already an EarlyPromise, just return it.
		if (promise.get) {
			return promise;
		}

		var value = (pendingValue !== undefined) ? pendingValue : null, 
			error = null;

		promise.then((resolvedValue) => {
			value = resolvedValue;
			return value;
		}).catch((resolvedError) => {
			error = resolvedError;
		})

		promise.get = function() { 
			if (null !== error) throw error;
			return value;
		};
		return promise;
	}
}