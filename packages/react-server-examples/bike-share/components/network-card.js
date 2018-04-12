import PropTypes from 'prop-types';
import React from 'react';
import { logging, Link } from 'react-server';

const logger = logging.getLogger(__LOGGER__);

const NetworkCard = ({ id, name, location, company }) => {
	logger.info(`rendering card for network ${name}`);
	return (
		<div><Link path={`/network?network=${id}`}>{name}</Link> in {location.city}, {location.country}, run by {company}</div>
	);
};

NetworkCard.propTypes = {
	company: PropTypes.any,
	href: PropTypes.string,
	id: PropTypes.string,
	location: PropTypes.shape({
		city: PropTypes.string,
		country: PropTypes.string,
		latitude: PropTypes.number,
		longitude: PropTypes.number,
	}),
	name: PropTypes.string,
	stations: PropTypes.array,
};

NetworkCard.displayName = 'NetworkCard';

export default NetworkCard;
