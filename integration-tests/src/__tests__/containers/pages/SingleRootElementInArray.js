import React from "react";
import {RootElement} from "react-server";
export default class SingleRootElementInArrayPage {
	getElements() {
		return [
			<RootElement>
				<div>foo</div>
			</RootElement>
		]
	}
}
