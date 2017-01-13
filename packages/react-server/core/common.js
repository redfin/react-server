// the common object model of react-server on server and client -sra.

module.exports = {
	RootContainer: require("./components/RootContainer"),
	RootElement: require("./components/RootElement"),
	Link: require('./components/Link'),
	TheFold: require('./components/TheFold').default,
	History: require('./components/History'),
	navigateTo: require('./util/navigateTo'),
	ClientRequest: require('./ClientRequest'),
	FramebackController: require('./FramebackController'),
	components: {
		FragmentDataCache: require('./components/FragmentDataCache'),
	},
	RequestLocalStorage: require('./util/RequestLocalStorage'),
	getCurrentRequestContext: require('./context/RequestContext').getCurrentRequestContext,
	bundleNameUtil: require("./util/bundleNameUtil"),
	PageUtil: require("./util/PageUtil"),
	logging: require("./logging"),
	config: require("./config"),
	ReactServerAgent: require('./ReactServerAgent'),

	// This variable is defined as part of the gulp build process.  The "client" package will set isBrowser === true.
	// The "server" package will set isBrowser === false.
	isBrowser: !SERVER_SIDE,
};
