import Q from "q";

// This loads the header code
// This loader is configured to fire off the request for the chunk
// as soon as the loader is called
const headerLoader = () => {
	const deferred = Q.defer();

	// We need this IS_SERVER check because require.ensure is not supported
	// on the server. There we just use regular require to get
	// the component

	// eslint-disable-next-line no-process-env
	if (process.env.IS_SERVER) {
		const component = require("../components/Header").default;
		deferred.resolve(component);
	} else {
		require.ensure([], function() {
			const component = require("../components/Header").default;
			deferred.resolve(component);
		}, "Header");
	}

	return deferred.promise;
};

export default headerLoader;
