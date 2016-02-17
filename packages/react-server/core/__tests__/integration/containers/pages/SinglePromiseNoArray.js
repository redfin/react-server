import React from "react";
import Q from "q";
export default class SinglePromiseNoArrayPage {
	getElements() {
		return Q.delay(10).then(() => <div>foo</div>);
	}
}
