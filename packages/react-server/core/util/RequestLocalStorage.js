var RequestLocalStorage = require('request-local-storage');

if (SERVER_SIDE) {
	RequestLocalStorage.patch(require('cls-q'));
}

module.exports = RequestLocalStorage;
