import {
	RequestLocalStorage,
	getCurrentRequestContext,
} from "react-server";

export default function PageNameMixin(cls, { prefix, defaultName }) {
	const RLS = RequestLocalStorage.getNamespace();

	cls.setResponse = function (res) {
		const path = getCurrentRequestContext().getCurrentPath().replace(prefix, "");

		// This is all we care about stashing away.  We'll _also_ receive the
		// response as a prop on our instance, later.  We just need the active
		// page _before_ our element is created (for the page title, etc)
		RLS().activePageName = (res.contents.reduce((page, section) => (
			page || section.pages.find(page => page.path === path)
		), null) || { name: defaultName }).name;

		// Pass it along.
		return res;
	}

	cls.activePageName = function () {
		return RLS().activePageName;
	}
}
