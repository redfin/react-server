export default class Favicon {
	getLinkTags(next) {
		return next().concat({
			rel: "icon",
			type: "image/x-icon",
			href: "favicon.ico?v=1",
		});
	}
}
