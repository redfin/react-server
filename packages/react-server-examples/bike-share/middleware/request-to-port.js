import {ReactServerAgent, isBrowser} from 'react-server';
export default class RequestToPortMiddleware {
	handleRoute(next) {
		if (!isBrowser) {
			ReactServerAgent.plugRequest(req => {
				req.urlPrefix('localhost:3000');
			});
		}
		return next();
	}
}
