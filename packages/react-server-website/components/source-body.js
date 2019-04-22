import React from 'react';
import Markdown from "./Markdown";
import SourceIntro from "./source-intro.md";
import './source-body.less';
import PropTypes from "prop-types";

export default function SourceBody ({text}) {
	return (
		text
			?<div dangerouslySetInnerHTML={{ __html: text}}></div>
			:<Markdown source={SourceIntro} />
	);
}
SourceBody.propTypes = {
	text: PropTypes.string,
};
