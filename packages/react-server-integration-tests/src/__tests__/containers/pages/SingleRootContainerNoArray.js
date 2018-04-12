import React from "react";
import { RootContainer } from "react-server";
export default class SingleRootContainerNoArrayPage {
	getElements() {
		return <RootContainer>
			<div>foo</div>
		</RootContainer>
	}
}
