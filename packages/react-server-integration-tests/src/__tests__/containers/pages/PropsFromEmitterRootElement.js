import React from "react";
import FooEmitter from "../data/FooEmitter";
import ValEcho from "../components/ValEcho";
import { RootElement } from "react-server";
export default class SingleRootElementInRootContainerPage {
	getElements() {
		return <RootElement listen={FooEmitter}>
			<ValEcho />
		</RootElement>
	}
}
