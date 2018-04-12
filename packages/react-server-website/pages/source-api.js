import path from 'path';

const extractBody = new RegExp('<body[^>]*>((.|[\n\r])*)<\/body>');

export default class SourceApi {
	setConfigValues() {
		return { isRawResponse: true };
	}

	getContentType() {
		return 'application/json';
	}

	getResponseData() {
		const filepath = path.resolve(path.join('docs', this.getRequest().getQuery().page));
		return new Promise((resolve, reject) => {
			if (!filepath.includes(process.cwd())) {
				reject(new Error('Authorization Denied'));
			}
			try {
				const text = extractBody.exec(require(filepath))[1]
				resolve(JSON.stringify({ text }));
			} catch (e) {
				reject(e);
			}
		});
	}
}
