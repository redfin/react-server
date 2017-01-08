// takes in an array of options objects for `startServer.js`, and returns a merged
// version of them. it essentially acts like Object.assign(), so options objects
// later in the argument list override the properties of ones earlier in the list.
// like Object.assign, the merging is done on a property-by-property basis;
// they are not merged deeply.
// the only thing that makes this not exactly Object.assign is that options objects
// can have an env attribute that contains overrides for different values for NODE_ENV.
const merge = (options, ...optionsToBeMerged) => {
	let optionsCopy = Object.assign({}, options);

	// first merge in any overrides based on the current node environment.
	if (optionsCopy.env) {
		const env = optionsCopy.env;
		delete optionsCopy.env;
		// if there's an override for the current NODE_ENV, let's use it.
		if (env[process.env.NODE_ENV]) { //eslint-disable-line no-process-env
			optionsCopy = merge(optionsCopy, env[process.env.NODE_ENV]); //eslint-disable-line no-process-env
		}
	}

	// now merge in the rest of the options objects.
	if (optionsToBeMerged.length > 0) {
		return Object.assign(optionsCopy, merge(...optionsToBeMerged));
	} else {
		return optionsCopy;
	}
}

export default merge;
