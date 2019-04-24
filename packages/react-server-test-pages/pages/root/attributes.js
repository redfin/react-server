/* eslint-disable react/react-in-jsx-scope */

import {RootContainer, RootElement, Link} from "react-server";

const url = color => `/root/attributes?color=${color}`;

const Links = opts => <span>
	<Link path={url( "red"    )} {...opts}>Red</    Link><span> | </span>
	<Link path={url( "yellow" )} {...opts}>Yellow</ Link><span> | </span>
	<Link path={url( "green"  )} {...opts}>Green</  Link>
</span>

export default class RootAttributesPage {
	getElements() {
		const color = this.getRequest().getQuery().color || "white";
		const style = `background-color: ${color}`;
		return <RootContainer>
			<div>Background below the hr should be <em>{color}</em></div>
			<div><Links /> (normal)</div>
			<div><Links reuseDom={true}/> (reuseDom)</div>
			<hr />
			<RootContainer style={style}>
				<div>RootContainer</div>
			</RootContainer>
			<RootElement style={style}>
				<div>RootElement</div>
			</RootElement>
		</RootContainer>
	}
}
