class RawResponsePage {

	setConfigValues(){ return { isRawResponse: true } }

	getContentType() {
		return "application/example";
	}
}

module.exports = RawResponsePage;
