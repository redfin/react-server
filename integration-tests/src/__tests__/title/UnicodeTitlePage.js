
class UnicodeTitlePage {
	getTitle() {
		// 我叫艾肯 ("wo jiao ai ken") is "my name is aickin" in Chinese
		// Chișinău is the capital of Moldova
		// مرحبا is "hello" in Arabic (according to Google Translate)
		// the last character is a penguin (and outside the BMP, for good measure)
		return "我叫艾肯 Chișinău مرحبا 🐧";
	}
}

module.exports = UnicodeTitlePage;