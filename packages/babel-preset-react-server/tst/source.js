import {logging} from 'react-server';

const label = 'foo';
const logger = logging.getLogger(__LOGGER__);
const fooLogger = logging.getLogger(__LOGGER__({ label }));
