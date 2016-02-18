import React from "react"
import Q from "q"

export default class InternalServerErrorException {
	handleRoute() {
		// This is just to verify that we don't render after a real
		// exception even if we claim that we can.
		this.setHaveDocument(true);

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
