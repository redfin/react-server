import React from 'react';
import { logging } from 'react-server';

const logger = logging.getLogger(__LOGGER__);

export default ({ headerText }) => {
	logger.info("rendering the header");

	return (
		<div className="header">
			React-Server {headerText}
		</div>
	);
}
