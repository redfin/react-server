import React from 'react';
import {logging} from 'react-server';

const logger = logging.getLogger(__LOGGER__);

export default () => {
	logger.info('rendering the footer');
	return (<div className="footer">
		<span>Brought to you by </span>
		<a href="http://github.com/redfin/react-server">React Server</a>
		<span> and </span>
		<a href="http://api.citybik.es/v2/">citybik.es</a>
	</div>);
};
