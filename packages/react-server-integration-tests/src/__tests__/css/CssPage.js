var React = require("react");
var BasicCss = require("./BasicCss.css");

class CssPage {
	getElements() {
		return <div id="foo" className="red">Hello, world!</div>;
	}
}
module.exports = CssPage;
