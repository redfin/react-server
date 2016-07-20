
module.exports = {
	middleware: [
		'./middleware/RequestToPort',
	],
	routes: {
		HelloWorld: {
			path: ['/'],
			method: 'get',
			page: './pages/hello-world',
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
