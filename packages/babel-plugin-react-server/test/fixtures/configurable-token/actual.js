var logger = require('react-server').logging.getLogger(BAR);
var fooLogger = logging.getLogger(BAR({ label: "foo" }));
var barLogger = logging.getLogger(BAR({ label: "bar" }));
