var logger = require('./logging').getLogger(__LOGGER__);

const getDevErrorPage = (error) => {
	let message = error.stack || error.message || error;
	return `<pre>
<b>Couldn't render a page!</b>\n
<b>Code:</b> ${error.code}\n
<b>Error:</b> ${message}\n
</pre>`;
}

const logError = (code, error) => {
	//If this is an internal server error log the whole stack trace, otherwise
	//just log the message
	if (!code || String(code).startsWith("5")) {
		logger.error(error);
	}
	else {
		logger.error(error.message || error);
	}
}

module.exports = function(err, req, res, next) {

	let code = err.code || err.status;

	logError(code, err);

	//Delegate to default express error handler if headers have been sent
	if (res.headersSent) {
		next(err);
		return;
	}

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
		res.send(`<pre>${err.message || err}</pre>`); //Just send error message in production
		return;
	}

	res.send(getDevErrorPage(err));
}
