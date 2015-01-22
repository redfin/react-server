/*
 * Include a logger in your module with:
 *
 *   var logger = require('triton').logging.getLogger(__LOGGER__);
 *
 * This `logger` has methods for each level specified in logging/common.js.
 *
 * Example:
 *
 *   logger.debug("result: %s", result);
 *
 * It *also* has a `time` method for timing named metrics.  Metric names
 * should be dot-separated and be few in number (i.e. don't include object
 * IDs or other variables with many potential values).
 *
 * Example:
 *
 *   logger.time(`result.${http_status_code}`, time_in_ms);
 *
 * It *also* has a `guage` method for tracking integer values.
 *
 * Example:
 *
 *   logger.guage("response_size_in_bytes", size_in_bytes);
 *
 * If you need more than one logger in your module, you can distinguish them
 * with labels:
 *
 * Example:
 *
 *   var fooLogger = logging.getLogger(__LOGGER__({ label: "foo" }));
 *   var barLogger = logging.getLogger(__LOGGER__({ label: "bar" }));
 *
 */
if (SERVER_SIDE)
	module.exports = require('./logging/server.js');
else
	module.exports = require('./logging/client.js');
