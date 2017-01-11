import React from 'react';
import {logging} from 'react-server';
import StationCard from './station-card';

const logger = logging.getLogger(__LOGGER__);

const StationList = ({stations}) => {
	logger.info(`rendering list of ${stations.length} stations`);
	const stationCards = stations.map(station => <StationCard station={station} key={station.id}/>);
	return <div>{stationCards}</div>;
};

StationList.propTypes = {
	stations: React.PropTypes.array,
};

StationList.displayName = 'StationList';

export default StationList;
