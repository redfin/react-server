var React = require("react");

class MultiElementPage {
	getElements() { 
		return [
			<div id="foo1">Div1</div>, 
			<div id="foo2">Div2</div>
		];
	}
}
module.exports = MultiElementPage;