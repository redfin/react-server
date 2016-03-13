import React from "react";
import FooEmitter from "../data/FooEmitter";
import ValEcho from "../components/ValEcho";
import {RootContainer} from "../../../../common";
export default class SingleRootElementInRootContainerPage {
	getElements() {
		return <RootContainer listen={FooEmitter}>
			<ValEcho />
		</RootContainer>
	}
}
