import React from "react";
import RootElement from "../../../../components/RootElement";
export default class SingleRootElementNoArrayPage {
	getElements() {
		return <RootElement>
			<div>foo</div>
		</RootElement>
	}
}
