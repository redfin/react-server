
module.exports = {
	middleware: [
		'./middleware/RequestToPort',
		'./middleware/Theme',
		'./middleware/PageHeader',
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
		DirectoryTreeApi: {
			path: ['/api/directory-tree'],
			method: 'get',
			page: './api/directory-tree',
		},
	},
};
