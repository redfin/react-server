import React from "react";
import RootElement from "../../../../components/RootElement";
export default class SingleRootElementInArrayPage {
	getElements() {
		return [
			<RootElement>
				<div>foo</div>
			</RootElement>
		]
	}
}
