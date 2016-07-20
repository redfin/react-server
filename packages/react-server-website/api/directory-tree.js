import {ReactServerAgent, logging} from 'react-server';

const logger = logging.getLogger(__LOGGER__);

export default class DirectoryTreeApi {
	setConfigValues() {
		return {isRawResponse: true};
	}

	handleRoute(next) {
		this.extension = this.getRequest().getQuery().extension;
		logger.info(`got directory tree api request${this.extension ? ' for extension ' + this.extension : ''}`);
		return next();
	}

	getContentType() {
		return 'application/json';
	}

	getResponseData() {
		let url = 'https://redfin:' + process.env.GITHUB_AUTH_TOKEN + '@api.github.com/repos/redfin/react-server/contents/';
		const extension = this.extension;
		return new Promise(resolve => {
			ReactServerAgent.get(url).then(data => {
				let files = data.body;
				files = this._filterFiles(files, extension);
				resolve(JSON.stringify(files));
			});
		});
	}

	_filterFiles(files, extension) {
		if (extension) {
			const regex = new RegExp('\\.' + extension);
			return files.filter(file => file.type === 'file' && regex.test(file.name));
		} else {
			return files.filter(file => file.type === 'file');
		}
	}
}
