// the page value for routes.routes["SomeRoute"] can either be a string for the default
// module name or an object mapping format names to module names. This method normalizes
// the value to an object.
export default function normalizeRoutesPage(page) {
	if (typeof page === "string") {
		return {default: page};
	}
	return page;
}
