import { navigateTo } from "react-server";

const go = page => navigateTo(
	`/navigation/navigateTo?cur=${page}`,
	{ reuseDom: true }
)

const Nav = ({ cur }) => <div onClick={() => go(cur + 1)}>
	<div>Current page: {cur}</div>
	<div>Click for next page</div>
</div>

export default class NavigateToPage {
	getElements() {
		return <Nav cur={+this.getRequest().getQuery().cur || 0} />
	}
}
