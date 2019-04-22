import React from 'react';
import {logging} from 'react-server';

const logger = logging.getLogger(__LOGGER__);

const Header = () => {
	logger.info('rendering the header');
	return (<h1 className="header">React Server city bikes page</h1>);
};

export default Header;
