import { getNetworks, getNetwork } from "./networks";

function setJsonContentType(req, res, next) {
	res.type('json');
	next();
}

export default function registerCustomMiddlewares(server, registerRenderMiddleware) {
	server.use('/api', setJsonContentType);
	server.get('/api/networks', getNetworks);
	server.get('/api/networks/:network', getNetwork);
	registerRenderMiddleware();
};
