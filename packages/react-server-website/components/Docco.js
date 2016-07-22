import React from 'react';
import './Docco.less';

export default function Docco ({text}) {
	return (
		<div dangerouslySetInnerHTML={{ __html: text}}></div>
	);
}
