var Q = require("q");

var PromiseUtil = module.exports = {
	/**
	 * Translates a normal Promise to a simple EarlyPromise.
	 *     promise (required): the promise to translate.
	 *     pendingValueFn (optional): a function that synchronously gives the value to be returned by getValue while the promise is pending.
	 *         defaults to null if not present.
	 */
	early(promise, pendingValueFn) {
		// if it's already an EarlyPromise, just return it.
		if (promise && promise.getValue) {
			return promise;
		}

		var isResolved = false,
			resolvedValue,
			rejectedError = null;

		promise.then((value) => {
			resolvedValue = value;
			isResolved = true;
			return value;
		}).catch((error) => {
			rejectedError = error;
		})

		promise.getValue = function() {
			if (null !== rejectedError) throw rejectedError;
			if (isResolved) return resolvedValue;
			if (typeof pendingValueFn === "undefined") return null;
			return pendingValueFn();
		};
		return promise;
	},

	/**
	 * Return the value of the first resolved or rejected promise in the arguments array
	 */
	race(...promises) {
		var resultDeferred = Q.defer();

		promises.forEach((promise) => {
			promise.then(
				(value) => resultDeferred.resolve(value),
				(error) => resultDeferred.reject(error));
		});

		return resultDeferred.promise;
	}
}