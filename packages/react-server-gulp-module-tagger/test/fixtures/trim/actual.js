var logger = require('react-server').logging.getLogger(__LOGGER__);
var fooLogger = logging.getLogger(__LOGGER__({ label: "foo" }));
var barLogger = logging.getLogger(__LOGGER__({ label: "bar" }));
