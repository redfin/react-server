/*
 * Include a logger in your module with:
 *
 *   var logger = require('triton/core/logging').getLogger(__LOGGING_NAME__);
 *
 * This `logger` has methods for each level specified in logging/common.js.
 *
 * Example:
 *
 *   logger.debug("result: %s", result);
 *
 */
if (SERVER_SIDE)
	module.exports = require('./logging/server.js');
else
	module.exports = require('./logging/client.js');
