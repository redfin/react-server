import React from 'react';
import './source-body.less';

export default function SourceBody ({text}) {
	return (
		<div dangerouslySetInnerHTML={{ __html: text}}></div>
	);
}
