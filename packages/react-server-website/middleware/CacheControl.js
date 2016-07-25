import {getCurrentRequestContext} from "react-server";

export default class CacheControlMiddleware {
	handleRoute(next){
		if (typeof window === "undefined") {
			// Cache everything for one minute.
			getCurrentRequestContext().getServerStash().res
				.set("Cache-Control", "max-age=60");
		}
		return next();
	}
}
