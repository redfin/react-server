
import HttpError from './errors/HttpError';

var logger = require('./logging').getLogger(__LOGGER__);

module.exports = function(err, req, res, next) {

	logger.error(err.message, err);

	//Delegate to default express error handler if headers have been sent,
	//or if we are dealing with a native error
	if (res.headersSent || !(err instanceof HttpError)) {
		next(err);
		return;
	}

	let code = err.code || err.status;

	if (code === 301 || code === 302 || code === 307) {
		res.redirect(code, err.redirectUrl);
		return;
	}

	//Some rough bounds checking here
	if (typeof code !== "number" || code <= 0 || code >= 1000) {
		code = 500;
	}

	res.status(code);

	if (process.env.NODE_ENV === "production") { // eslint-disable-line no-process-env
		res.send(err.message);
		return;
	}

	res.json({
		message: err.message,
		code: code,
		metaData: err.metaData,
	});
}
