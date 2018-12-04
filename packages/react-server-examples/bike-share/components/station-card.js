import PropTypes from 'prop-types';
import React from 'react';
import {logging} from 'react-server';

const logger = logging.getLogger(__LOGGER__);
const timeSinceTimestamp = s => {
	const parsed = Date.parse(s);
	const timeSince = (new Date()) - parsed;
	const minutesSince = Math.floor(timeSince / 60000);
	const secondsSince = Math.floor((timeSince / 1000) % 60);
	return `${minutesSince} min, ${secondsSince} sec`;
};

const StationCard = ({station}) => {
	logger.info(`rendering card for station ${JSON.stringify(station)}`);
	return (
		<div>{station.name} had {station.empty_slots} empty slots {timeSinceTimestamp(station.timestamp)} ago.</div>
	);
};

StationCard.propTypes = {
	station: PropTypes.shape({
		empty_slots: PropTypes.number, // eslint-disable-line
		extra: PropTypes.object,
		free_bikes: PropTypes.number, // eslint-disable-line
		id: PropTypes.string,
		latitude: PropTypes.number,
		longitude: PropTypes.number,
		name: PropTypes.string,
		timestamp: PropTypes.string,
	}),
};

StationCard.displayName = 'StationCard';

export default StationCard;
