const path = require('path');

module.exports = {
	routes: {
		HelloWorld: {
			path: ['/'],
			method: 'get',
			page: path.join('.', 'pages', 'hello-world'),
		},
	},
};
