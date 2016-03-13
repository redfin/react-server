import React from "react";
import Q from "q";
export default class SinglePromiseInArrayPage {
	getElements() {
		return [Q.delay(10).then(() => <div>foo</div>)];
	}
}
