import React from "react";
import {RootContainer} from "react-server";
export default class AttributesOnRootContainerPage {
	getElements() {
		return <RootContainer id="foo" className="bar" style="baz">
			<div></div>
		</RootContainer>
	}
}
