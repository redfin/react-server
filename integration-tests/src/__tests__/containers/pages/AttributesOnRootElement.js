import React from "react";
import {RootElement} from "react-server";
export default class AttributesOnRootElementPage {
	getElements() {
		return <RootElement id="foo" className="bar" style="color: red;">
			<div></div>
		</RootElement>
	}
}
