import React from 'react';
import {logging} from 'react-server';
import PropTypes from "prop-types";

const logger = logging.getLogger(__LOGGER__);

const Header = ({ headerText }) => {
	logger.info("rendering the header");

	return (
		<div className="header">
			React-Server { headerText }
		</div>
	);
};
Header.propTypes = {
	headerText: PropTypes.string,
};

export default Header
