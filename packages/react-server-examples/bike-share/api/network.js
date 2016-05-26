import {ReactServerAgent, logging} from 'react-server';

const logger = logging.getLogger(__LOGGER__);

export default class NetworkApi {
	setConfigValues() {
		return {isRawResponse: true};
	}

	handleRoute(next) {
		this.network = this.getRequest().getQuery().network;
		logger.info(`got network api request${this.network ? ' for network ' + this.network : ''}`);
		return next();
	}

	getContentType() {
		return 'application/json';
	}

	getResponseData() {
		let url = 'http://api.citybik.es/v2/networks';
		if (this.network) {
			url += `/${this.network}`;
		}
		return new Promise(resolve => {
			ReactServerAgent.get(url).then(data => {
				logger.info(`got data ${JSON.stringify(data)} from url ${url}`);
				resolve(JSON.stringify(data));
			});
		});
	}
}
