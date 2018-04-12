import React from 'react';
import Markdown from "./Markdown";
import SourceIntro from "./source-intro.md";
import './source-body.less';

export default function SourceBody({ text }) {
	return (
		text
			? <div dangerouslySetInnerHTML={{ __html: text }}></div>
			: <Markdown source={SourceIntro} />
	);
}
