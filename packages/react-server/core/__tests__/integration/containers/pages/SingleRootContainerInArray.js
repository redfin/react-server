import React from "react";
import RootContainer from "../../../../components/RootContainer";
export default class SingleRootContainerInArrayPage {
	getElements() {
		return [
			<RootContainer>
				<div>foo</div>
			</RootContainer>
		]
	}
}
