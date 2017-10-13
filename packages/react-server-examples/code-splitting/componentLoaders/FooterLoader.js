import Q from "q";

const _loadFooterCode = (deferred) => {
	require.ensure([], function() {
		const component = require("../components/Footer").default;
		deferred.resolve(component);
	}, "Footer");
}

// This will load the footer code when called
// This loader is configured to wait 6 seconds after it was called
// before it fires off the network request to load the chunk
const footerLoader = () => {
	const deferred = Q.defer();

	// eslint-disable-next-line no-process-env
	if (process.env.IS_SERVER) {
		const component = require("../components/Footer").default;
		deferred.resolve(component);
	} else {
		setTimeout(_loadFooterCode.bind(null, deferred), 6000);
	}

	return deferred.promise;
};

export default footerLoader;
