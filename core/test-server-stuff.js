
var debug = require('debug')('test-server-stuff');

function setupFakeApi(server) {

	server.get('/r3s/api/propertyList/:id', function (req, res, next) {

		// debug('Cookies: ', req.cookies);
		// debug('Cookies: ', req.get('Cookie'));

		var listId = parseInt(req.params.id,10),
			propertyList;
		if (listId === 1) {
			propertyList = [
				{
					id: 1,
					address: "123 Main St, San Francisco, CA 94110"
				},
				{
					id: 3,
					address: '4321 Francis Ave N, Seattle, 98105'
				}
			]
		} else if (listId === 2) {
			propertyList = [
				{
					id: 2,
					address: "444 Main St, San Francisco, CA 94110"
				},
				{
					id: 3,
					address: '1111 Some Ave N, Seattle, 98107'
				},
				{
					id: 5,
					address: "1222 Mainish St, San Francisco, CA 94110"
				},
				{
					id: 7,
					address: '7667 Coit Ave N, Seattle, 98107'
				},
			]
		}

		var delay = (listId === 2) ? 750 : 200;
		// if (req.query.delay) {
		// 	delay = parseInt(req.query.delay, 10);
		// }

		// imitate data load call, even though we hard-coded it
		setTimeout(function () {
			res.type('application/json');
			res.write(JSON.stringify(propertyList || []));
			res.end();
		}, delay);

	});

}


module.exports = {

	setup: function (server) {
		setupFakeApi(server);
	}

}