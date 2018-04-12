import './Theme/base.less';

export default class ThemeMiddleware {
	getMetaTags() {
		return [
			{ charset: 'utf8' },
			{ 'http-equiv': 'x-ua-compatible', 'content': 'ie=edge' },
			{ name: 'viewport', content: 'width=device-width, initial-scale=1' },
			{ name: 'description', content: 'Blazing fast page load and seamless navigation. Powered by React Server.' },
			{ name: 'generator', content: 'React Server' },
		];
	}

	handleRoute(next) {
		return next();
	}
}
