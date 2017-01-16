export default class DumbPage {
	getElements() {
		const routeName = this.getRequest().getRouteName();
		return <div id="routeName">{routeName}</div>;
	}
}
