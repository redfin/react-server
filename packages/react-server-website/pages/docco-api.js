import path from 'path';

export default class PageDocApi {
	setConfigValues() {
		return {isRawResponse: true};
	}

	getContentType() {
		return 'text/html';
	}

	getResponseData() {
		const filepath = path.resolve(path.join('docs', this.getRequest().getQuery().page));
		return new Promise((resolve, reject) => {
			if (!filepath.includes(process.cwd())) {
				reject(new Error('Authorization Denied'));
			}
			try {
				resolve(require(filepath))
			} catch (e) {
				reject(e);
			}
		});
	}
}
