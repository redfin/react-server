// Can't use `instanceof` with babel-ified subclasses of builtins.
//
//   https://phabricator.babeljs.io/T3083
//
// Gotta do this the old-fashioned way. :p
//
export default function ConfigurationError(message) {
	this.name = 'ConfigurationError';
	this.message = message;
	this.stack = (new Error()).stack;
}
ConfigurationError.prototype = Object.create(Error.prototype);
ConfigurationError.prototype.constructor = ConfigurationError;
