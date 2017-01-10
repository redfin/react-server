import React from 'react';
import {logging} from 'react-server';
import NetworkCard from './network-card';

const logger = logging.getLogger(__LOGGER__);

const NetworkList = ({networks}) => {
	logger.info(`rendering list of ${networks.length} networks`);
	const networkCards = networks.map(network => {
		return <NetworkCard key={network.id} {...network}/>;
	});
	return <div>{networkCards}</div>;
};

NetworkList.propTypes = {
	networks: React.PropTypes.array,
};

NetworkList.displayName = 'NetworkList';

export default NetworkList;
