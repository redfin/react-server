
module.exports = {
	middleware: [
		'./middleware/RequestToPort',
	],
	routes: {
		HelloWorld: {
			path: ['/'],
			method: 'get',
			page: './pages/homepage',
		},
		DocsApi: {
			path: ['/api/docs'],
			method: 'get',
			page: './pages/docs-api',
		},
	},
};
