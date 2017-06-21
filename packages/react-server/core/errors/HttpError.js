//Basic wrapper for errors that elicit a non-2xx HTTP response
//Examples: 404, 400, 500
export default class HttpError extends Error {
	constructor(message, metaData) {
		super(message);
		this.name = this.constructor.name;
		this.code = this.status = metaData && metaData.code ? metaData.code : 500;
		this.metaData = metaData;

		if (typeof Error.captureStackTrace === 'function') {
			Error.captureStackTrace(this, this.constructor);
		}
		else {
			this.stack = (new Error(message)).stack;
		}
	}
}
