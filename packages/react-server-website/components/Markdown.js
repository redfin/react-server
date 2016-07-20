import React from 'react';

import Remarkable from 'remarkable';
import hljs from 'highlight.js';

import {logging} from 'react-server';

import './Markdown.css';

const logger = logging.getLogger(__LOGGER__);

export default class Markdown extends React.Component {
	render() {
		let content = this.props.children || this.props.source;

		return <span dangerouslySetInnerHTML={{ __html: this._renderRemarkable(content) }} />
	}

	_renderRemarkable(content) {
		// Remarkable hljs handling, from documentation
		const md = new Remarkable({
			highlight: function (str, lang) {
				if (lang && hljs.getLanguage(lang)) {
					try {
						return hljs.highlight(lang, str).value;
					} catch (err) { logger.log(err); }
				}

				try {
					return hljs.highlightAuto(str).value;
				} catch (err) { logger.log(err); }

				return ''; // use external default escaping
			},
		});
		debugger;

		return md.render(content);
	}
}
