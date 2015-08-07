var Q      = require('q')
,   logger = require('./logging').getLogger(__LOGGER__)

var {PAGE_CONTENT_NODE_ID} = require('./constants');

class FramebackController {

	constructor() {
		this.active = false;
	}

	isActive(){
		return this.active;
	}

	navigateTo(url){
		var dfd = Q.defer();

		logger.debug(`Navigating to ${url}`);

		this.active = true;

		this.hideMaster();

		// TODO: The frame...
		dfd.resolve();

		return dfd.promise;
	}

	navigateBack(){
		logger.debug(`Navigating back`);
		this.showMaster();
		this.active = false;
	}

	hideMaster(){
		contentDiv().style.display = 'none';
	}

	showMaster(){
		contentDiv().style.display = 'block';
	}
}

function contentDiv(){
	return document.body.querySelector(`div[${PAGE_CONTENT_NODE_ID}]`);
}

module.exports = FramebackController;
