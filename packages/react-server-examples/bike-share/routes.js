module.exports = {
	middleware: [
		'./middleware/request-to-port',
	],
	routes: {
		Index: {
			path: ['/'],
			method: 'get',
			page: './pages/index',
		},
		Network: {
			path: ['/network'],
			method: 'get',
			page: './pages/network',
		},
		NetworkApi: {
			path: ['/api/networks'],
			method: 'get',
			page: './api/network',
		},
	},
};
