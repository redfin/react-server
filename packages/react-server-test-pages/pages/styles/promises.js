
import React from "react";

export default class StylePromises {
	getHeadStylesheets () {
		return [
			delay(1000)
				.then(() => "./styles/first.css"),
			delay(100)
				.then(() => "./styles/second.css"),
		];
	}

	getElements () {
		return [
			<div>If first.css shows up before second.css in the body of this page, all is well.</div>,
		]
	}

}

function delay(ms) {
	let _res;
	const p = new Promise(function (res) {
		_res = res;
	});
	setTimeout(() => {
		_res()
	}, ms);
	return p;
}
