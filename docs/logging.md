Include a logger in your module with:

```javascript
var logger = require('react-server').logging.getLogger(__LOGGER__);
```

This `logger` has methods for many log levels. In order: emergency, alert,
critical, error, warning, notice, info, debug.

Example:

```javascript
logger.debug(`result: ${result}`);
```

Standard log-level methods accept an additional argument, which can be an
arbitrary data structure.

Example:

```javascript
try {
  some_work();
} catch (err) {
  logger.error("Error calling some_work()", err);
}
```

It also has a `time` method for timing named metrics.  Metric names
should be dot-separated and be few in number (i.e. don't include object
IDs or other variables with many potential values).

Example:

```javascript
logger.time(`result.${http_status_code}`, time_in_ms);
```

Another way to log timings is with a `timer` object.

Example:

```javascript
var timer = logger.timer('some_work');
some_work().then(timer.stop);
```

It also has a `gauge` method for tracking integer values.

Example:

```javascript
logger.gauge("response_size_in_bytes", size_in_bytes);
```

If you need more than one logger in your module, you can distinguish them
with labels:

Example:

```javascript
var fooLogger = logging.getLogger(__LOGGER__({ label: "foo" }));
var barLogger = logging.getLogger(__LOGGER__({ label: "bar" }));
```

See [module-tagging](/module-tagging) for more details on how `__LOGGER__` is
replaced.
