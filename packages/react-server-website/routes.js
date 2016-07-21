
module.exports = {
	middleware: [
		'./middleware/RequestToPort',
		'./middleware/Theme',
		'./middleware/PageHeader',
		'./middleware/Analytics',
	],
	routes: {
		homepage: {
			path: ['/'],
			method: 'get',
			page: './pages/homepage',
		},
		docs: {
			path: ['/docs:path(.*)'],
			method: 'get',
			page: './pages/docs',
		},
		DocsApi: {
			path: ['/api/docs'],
			method: 'get',
			page: './pages/docs-api',
		},
		ContentsApi: {
			path: ['/api/contents'],
			method: 'get',
			page: './pages/contents-api',
		},
		DoccoApi: {
			path: ['/api/docco'],
			method: 'get',
			page: './pages/docco-api',
		},
	},
};
