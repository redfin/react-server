// the common object model of react-server on server and client -sra.

module.exports = {
	RootContainer: require("./components/RootContainer"),
	RootElement: require("./components/RootElement"),
	Link: require('./components/Link'),
	TheFold: require('./components/TheFold'),
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
}
