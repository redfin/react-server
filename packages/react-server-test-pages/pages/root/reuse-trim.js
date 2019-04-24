/* eslint-disable react/react-in-jsx-scope */

import {Link} from "react-server";

export default class RootReuseTrimPage {
	getElements() {
		const {trim} = this.getRequest().getQuery();
		const ret = [
			<Link key={0} reuseDom={true} path="/root/reuse-trim?trim=1">trim</Link>,
			<div key={1} >There should{trim?<em> not</em>:''} be an element below this one.</div>,
		];
		if (!trim) {
			ret.push(<div key={2}>Here I am!</div>);
		}
		return ret;
	}
}
