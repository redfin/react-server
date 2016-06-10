import {ReactServerAgent} from 'react-server';
export default class RequestToPortMiddleware {
	handleRoute(next) {
		if (typeof window === 'undefined') { //eslint-disable-line
			ReactServerAgent.plugRequest(req => {
				req.urlPrefix('localhost:3000');
			});
		}
		return next();
	}
}
