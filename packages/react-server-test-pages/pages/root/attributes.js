import {RootContainer, RootElement, Link} from "react-server";
require("./attributes.css");

const url = color => `/root/attributes?color=${color}`;

const ColorLinks = opts => <span>
	<Link path={url( "red"    )} {...opts}>Red</    Link><span> | </span>
	<Link path={url( "yellow" )} {...opts}>Yellow</ Link><span> | </span>
	<Link path={url( "green"  )} {...opts}>Green</  Link>
</span>

export default class RootAttributesPage {
	getElements() {
		const color = this.getRequest().getQuery().color || "white";
		const style = `background-color: ${color}`;
		return <RootContainer>

			<h2>style</h2>
			<div><ColorLinks /> (normal)</div>
			<div><ColorLinks reuseDom={true}/> (reuseDom)</div>
			<RootContainer style={style}>
				<div className="example">RootContainer should be {color}</div>
			</RootContainer>
			<RootElement style={style}>
				<div className="example">RootElement should be {color}</div>
			</RootElement>

			<h2>className</h2>
			<RootContainer className="example-class">
				<div className="example">RootContainer should be "salmon"</div>
			</RootContainer>
			<RootElement className="example-class">
				<div className="example">RootElement should be "salmon"</div>
			</RootElement>

			<h2>tagName</h2>
			<RootContainer tagName="section">
				<div className="example">RootContainer should be "turquoise"</div>
			</RootContainer>
			<RootElement tagName="section">
				<div className="example">RootElement should be "turquoise"</div>
			</RootElement>

		</RootContainer>
	}
}
