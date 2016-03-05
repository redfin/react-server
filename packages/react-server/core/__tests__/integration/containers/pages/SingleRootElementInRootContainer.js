import React from "react";
import {RootContainer, RootElement} from "../../../../common";
export default class SingleRootElementInRootContainerPage {
	getElements() {
		return <RootContainer>
			<RootElement>
				<div>foo</div>
			</RootElement>
		</RootContainer>
	}
}
