const logger = require('react-server').logging.getLogger(__JOEVIN_JONES__);
const fooLogger = logging.getLogger(__JOEVIN_JONES__({ label: 'foo' }));
const barLogger = logging.getLogger(__JOEVIN_JONES__({ label: 'bar' }));
