var Q = require("q"), 
	PromiseUtil = require("./PromiseUtil");

var PageUtil = module.exports = {
	/**
	 * This method takes in anything returns from a Page.getElements call and returns the 
	 * elements in a standardized format: an array of EarlyPromises of ReactElements.
	 */
	standardizeElements(elements) {
		var result = elements;

		// the return value could be a single element or an array. first, let's
		// make sure that it's an array.
		result = PageUtil.makeArray(result);

		// next, ensure that all elements are EarlyPromises.
		result = result.map((element) => {
			return PromiseUtil.early(Q(element));
		});

		return result;
	},

	standardizeMetaTags(metaTags) {
		var returnValue = {}
		Object.keys(metaTags).forEach((key) => {
			returnValue[key] = Q(metaTags[key]);
		});

		return returnValue;
	},

	/**
	 * Given an array of page instances, return an object that implements the page interface. This returned object's
	 * methods delegate to the first page in the pages array, passing the second page's implementation as the next
	 * variable (and the second page's implementation gets the third page's next, and so on). 
	 */
	createPageChain(pages) {

		return {
			handleRoute: PageUtil.createFunctionChain(pages, "handleRoute", 2, () => ({code:200}), Q),
			getTitle: PageUtil.createFunctionChain(pages, "getTitle", 0, () => "", Q), 
			getHeadScriptFiles: PageUtil.createFunctionChain(pages, "getHeadScriptFiles", 0, () => [], PageUtil.makeArray),
			getSystemScriptFiles: PageUtil.createFunctionChain(pages, "getSystemScriptFiles", 0, () => [], PageUtil.makeArray),
			getHeadStylesheets: PageUtil.createFunctionChain(pages, "getHeadStylesheets", 0, () => [], PageUtil.makeArray),
			getMetaTags: PageUtil.createFunctionChain(pages, "getMetaTags", 0, () =>  ({"Content-Type": "text/html; charset=utf-8"}), PageUtil.standardizeMetaTags),
			getCanonicalUrl: PageUtil.createFunctionChain(pages, "getCanonicalUrl", 0, () => "", Q),
			getElements: PageUtil.createFunctionChain(pages, "getElements", 0, () => [], PageUtil.standardizeElements)

		}
	},

	createFunctionChain(objects, functionName, argumentCount, defaultImpl, standardizeReturnValue) {
		if (argumentCount > 6) {
			throw new Error("createFunctionChain only supports methods with up to 6 arguments");
		}
		var nextImpl = () => {
			return standardizeReturnValue(defaultImpl.apply(null, arguments));
		};
		for (var i = objects.length - 1; i >= 0; i--) {

			nextImpl = ((nextImpl) => {
				if (objects[i][functionName]) {
					var objectForThis = objects[i];

					return function(a, b, c, d, e, f) {
						var args = [a, b, c, d, e, f];
						args = args.slice(0, argumentCount);
						args.push(nextImpl);
						var result = standardizeReturnValue(objectForThis[functionName].apply(objectForThis, args));
						return result;
					}

				}
				return nextImpl;
			})(nextImpl);
		}
		return nextImpl;
	},

	makeArray(valueOrArray) {
		if (!Array.isArray(valueOrArray)) {
			return [valueOrArray];
		}
		return valueOrArray;
	}
}