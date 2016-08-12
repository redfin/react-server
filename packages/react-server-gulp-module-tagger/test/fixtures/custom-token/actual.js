var logger = require('react-server').logging.getLogger(__OZZIE_ALONSO__);
var fooLogger = logging.getLogger(__OZZIE_ALONSO__({ label: "foo" }));
var barLogger = logging.getLogger(__OZZIE_ALONSO__({ label: "bar" }));
