import {ReactServerAgent} from "react-server";
export default class RequestToPortMiddleware {
	handleRoute(next){
		ReactServerAgent.plugRequest(req => {
			// TODO: Get port dynamically?
			req.urlPrefix('localhost:3000');
		});
		return next();
	}
}
