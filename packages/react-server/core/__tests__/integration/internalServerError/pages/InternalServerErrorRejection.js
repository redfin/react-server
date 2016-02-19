import React from "react"
import Q from "q"

export default class InternalServerErrorException {
	handleRoute() {

		var dfd = Q.defer();
		dfd.reject("rejected");

		return dfd.promise;
	}

	// Should never get called.
	getTitle() {
		return "foo";
	}

	// Should never get called.
	getElements() {
		return <div>foo</div>;
	}
}
