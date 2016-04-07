/*
 * Include a logger in your module with:
 *
 *   var logger = require('react-server').logging.getLogger(__LOGGER__);
 *
 * This `logger` has methods for each level specified in logging/common.js.
 *
 * Example:
 *
 *   logger.debug(`result: ${result}`);
 *
 * Standard log-level methods accept an additional argument, which can be an
 * arbitrary data structure.
 *
 * Example:
 *
 *   try {
 *       some_work();
 *   } catch (err) {
 *       logger.error("Error calling some_work()", err);
 *   }
 *
 * It *also* has a `time` method for timing named metrics.  Metric names
 * should be dot-separated and be few in number (i.e. don't include object
 * IDs or other variables with many potential values).
 *
 * Example:
 *
 *   logger.time(`result.${http_status_code}`, time_in_ms);
 *
 * Another way to log timings is with a `timer` object.
 *
 * Example:
 *
 *   var timer = logger.timer('some_work');
 *
 *   some_work().then(timer.stop);
 *
 * It *also* has a `gauge` method for tracking integer values.
 *
 * Example:
 *
 *   logger.gauge("response_size_in_bytes", size_in_bytes);
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
if (SERVER_SIDE) {
	module.exports = require('./logging/server.js');
} else {
	module.exports = require('./logging/client.js');
}
