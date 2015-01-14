
module.exports = {
	/**
	 * This method takes in anything returns from a Page.getElements call and returns the 
	 * elements in a standardized format: an array of ReactElementProviders.
	 */
	standardizeElements(elements) {
		var result = elements;

		// the return value could be a single element or an array. first, let's
		// make sure that it's an array.
		if (!Array.isArray(result)) {
			result = [result];
		}

		// TODO: make all of them ReactElementProviders
		return result;
	}
}