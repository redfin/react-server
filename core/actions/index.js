
var EventEmitter = require('events').EventEmitter;

class Action extends EventEmitter {

	trigger (payload) {
		if (SERVER_SIDE) {
			throw "Can't trigger events server-side!";
		}
		this.emit('trigger', payload);
	}

	triggerAsync (payload) {
		if (SERVER_SIDE) {
			throw "Can't trigger events server-side!";
		}
		setTimeout( () => {
			this.trigger(payload);
		}, 0);
	}

	onTrigger (callback) {
		if (SERVER_SIDE) {
			// ignore
			return;
		}
		this.addListener('trigger', callback);

		return {
			remove: () => {
				this.removeListener('trigger', callback);				
			}
		};
	}

}

/**
 * The API defined here loosely matches that of reflux.js
 */
function createAction() {
	var action = new Action();

	var func = function (payload) {
		action.triggerAsync(payload);
	}

	func.trigger = action.trigger.bind(action);
	func.triggerAsync = action.triggerAsync.bind(action);
	func.onTrigger = action.onTrigger.bind(action);

	return func;
}

module.exports = {
	createAction: createAction,
	createActions: function (actionNames) {
		var actions = {};
		actionNames.forEach( name => {
			actions[name] = createAction();
		});
		return actions;
	}
};