import request from "request-promise";
import {logging} from 'react-server';

const logger = logging.getLogger(__LOGGER__);
const citybikesApi = 'http://api.citybik.es/v2/networks';

export function getNetworks(req, res) {
	const url = citybikesApi;

	logger.info(`requesting ${url}`);
	request(url)
		.then(data => {
			logger.info(`got data ${data} from url ${url}`);
			res.status(200).send(data);
		})
		.catch(err => {
			// TODO handle 404s
			res.status(500).send(err);
		});
}

export function getNetwork(req, res) {
	const network = req.params.network;
	const url = `${citybikesApi}/${network}`;

	logger.info(`requesting ${url}`);
	request(url)
		.then(data => {
			logger.info(`got data ${data} from url ${url}`);
			res.status(200).send(data);
		})
		.catch(err => {
			// TODO handle 404s
			res.status(500).send(err);
		});
}
