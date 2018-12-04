import {ReactServerAgent} from "react-server";
export default class RequestToPortMiddleware {
	handleRoute(next){
		if (typeof window === "undefined"){
			ReactServerAgent.plugRequest(req => {
				req.urlPrefix('localhost:3000');
			});
		}
		return next();
	}
}
