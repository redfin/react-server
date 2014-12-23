// the common object model of triton on server and client -sra.

module.exports = {
	page: require("./core/PageObject"),
	baseStore: require('./core/stores/BaseStore'),
	link: require('./core/components/Link'),
	actions: require('./core/actions'),
	objectGraph: require('./core/util/ObjectGraph'),
	enums: require('./core/enums'),
	bundleNameUtil: require("./core/util/bundleNameUtil"),
	config: require("./core/config")
}