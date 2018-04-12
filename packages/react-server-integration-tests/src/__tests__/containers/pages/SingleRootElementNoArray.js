import React from "react";
import { RootElement } from "react-server";
export default class SingleRootElementNoArrayPage {
	getElements() {
		return <RootElement>
			<div>foo</div>
		</RootElement>
	}
}
