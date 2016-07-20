
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
		docs: {
			path: ['/docs/:path'],
			method: 'get',
			page: './pages/docs',
		},
		DocsApi: {
			path: ['/api/docs'],
			method: 'get',
			page: './pages/docs-api',
		},
	},
};
