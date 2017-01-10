import React from 'react';
import {logging, Link} from 'react-server';

const logger = logging.getLogger(__LOGGER__);

const NetworkCard = ({id, name, location, company}) => {
	logger.info(`rendering card for network ${name}`);
	return (
		<div><Link path={`/network?network=${id}`} frameback>{name}</Link> in {location.city}, {location.country}, run by {company}</div>
	);
};

NetworkCard.propTypes = {
	company: React.PropTypes.any,
	href: React.PropTypes.string,
	id: React.PropTypes.string,
	location: React.PropTypes.shape({
		city: React.PropTypes.string,
		country: React.PropTypes.string,
		latitude: React.PropTypes.number,
		longitude: React.PropTypes.number,
	}),
	name: React.PropTypes.string,
	stations: React.PropTypes.array,
};

NetworkCard.displayName = 'NetworkCard';

export default NetworkCard;
