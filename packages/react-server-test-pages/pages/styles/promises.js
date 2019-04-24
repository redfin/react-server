
import React from "react";

const greenBackground = `
	body {
		background: green;
	}
`;

const redBackground = `
	body {
		background: red;
	}
`;

export default class StylePromises {
	getHeadStylesheets () {
		return [
			delay(1000).then(() => `/data/echo-css?css=${encodeURIComponent(redBackground)}`),
			delay(100).then(() => `/data/echo-css?css=${encodeURIComponent(greenBackground)}`),
		];
	}

	getElements () {
		return [
			<div key={0}>
				<h2>If the background is GREEN at page load, all is well!</h2>
				<div>If it flashes red first, all is _not_ well.</div>
			</div>,
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
