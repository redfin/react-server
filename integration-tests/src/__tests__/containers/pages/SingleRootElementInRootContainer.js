import React from "react";
import {RootContainer, RootElement} from "react-server";
export default class SingleRootElementInRootContainerPage {
	getElements() {
		return <RootContainer>
			<RootElement>
				<div>foo</div>
			</RootElement>
		</RootContainer>
	}
}
