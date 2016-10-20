module.exports = {
	routes: {
		CounterPage: {
			path: ['/'],
			method: 'get',
			page: './pages/counter-app/index',
		},
		CounterAPI: {
			path: ['/count'],
			method: 'get',
			page: './pages/counter-app/api',
		},

	},
}
