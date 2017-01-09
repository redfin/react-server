export default class NormalValuesPage {
	getMetaTags() {
		return [
			{charset: 'utf8'},
		];
	}
	getLinkTags() {
		return [
			{ rel: "prefetch", href: "//www.google-analytics.com" },
		];
	}
	getBase() {
		return {
			href: '//www.google.com',
		};
	}
}
