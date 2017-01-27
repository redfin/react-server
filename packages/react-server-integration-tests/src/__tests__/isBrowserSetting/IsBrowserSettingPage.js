import React from 'react';
import { isBrowser } from "react-server";

export default class IsBrowserSettingPage {
	getElements() {
		return (
			<div>
				<span id="question">Is Browser:</span>
				<span id="answer">{JSON.stringify(isBrowser)}</span>
			</div>
		);
	}
}
