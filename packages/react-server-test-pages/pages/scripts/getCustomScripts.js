export default class CustomScriptPage {
	getElements() {
		return [
			<div>I'm just some test stuff</div>,
		];
	}

	getCustomScripts(next) {
		var inlineScript = {
			text: "console.log('This is a custom script');",
			type: "text/javascript",
			strict: false,
		}
		return [inlineScript].concat(next());
	}
}
