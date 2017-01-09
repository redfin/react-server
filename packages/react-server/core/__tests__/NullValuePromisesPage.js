import Q from 'q';

export default class NullValuePromisesPage {
	getMetaTags() {
		return Q.Promise((resolve) => {
			resolve(null);
		});
	}
	getLinkTags() {
		return Q.Promise((resolve) => {
			resolve(null);
		});
	}
	getBase() {
		return Q.Promise((resolve) => {
			resolve(null);
		});
	}
}
