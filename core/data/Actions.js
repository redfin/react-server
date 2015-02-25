var Reflux = require("reflux");

module.exports = {
	createAction() {
		return Reflux.createAction.apply(Reflux, arguments);
	},

	createActions() {
		return Reflux.createActions.apply(Reflux, arguments);
	}

}