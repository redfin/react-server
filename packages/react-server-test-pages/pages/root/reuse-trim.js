import { Link } from "react-server";

export default class RootReuseTrimPage {
	getElements() {
		const { trim } = this.getRequest().getQuery();
		const ret = [
			<Link reuseDom={true} path="/root/reuse-trim?trim=1">trim</Link>,
			<div>There should{trim ? <em> not</em> : ''} be an element below this one.</div>,
		];
		if (!trim) {
			ret.push(<div>Here I am!</div>);
		}
		return ret;
	}
}
