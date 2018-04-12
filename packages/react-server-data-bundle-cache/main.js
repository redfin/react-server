require("./lib/logging").setLogger(
	require("react-server").logging.getLogger(__LOGGER__)
);

module.exports = require("./lib/index.js");
module.exports.default = require("./lib/index.js");
