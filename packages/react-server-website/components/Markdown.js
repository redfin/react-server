import React from 'react';

import Remarkable from 'remarkable';
import hljs from '../lib/highlight.js';

import {logging, navigateTo} from 'react-server';

import './Markdown.less';

const logger = logging.getLogger(__LOGGER__);

export default class Markdown extends React.Component {
	render() {
		let content = this.props.children || this.props.source;

		return <span dangerouslySetInnerHTML={{ __html: this._renderMarkdown(content) }} />
	}

	_renderMarkdown(content) {
		// Remarkable hljs handling, from documentation
		const md = new Remarkable({
			highlight: function (str, lang) {
				if (lang && hljs.getLanguage(lang)) {
					try {
						return hljs.highlight(lang, str).value;
					} catch (err) { logger.log(err); }
				}

				try {
					// default to js
					return hljs.highlight("javascript", str).value;
				} catch (err) { logger.log(err); }

				return ''; // use external default escaping
			},
		});

		return md.render(content);
	}

	componentDidMount() {
		const aTags = document.getElementsByTagName('a');
		logger.info(aTags);
		logger.info(typeof aTags);
		const len = aTags.length;
		for (let i = 0; i < len; i++) {
			let a = aTags[i];
			if (isInternal(a)) {
				addOnClickHandler(a);
			} else {
				addTargetBlank(a);
			}
		}
	}
}

function isInternal(a) {
	const href = a.getAttribute('href');
	return href.startsWith('/');
}

function addOnClickHandler(a) {
	a.onclick = function (e) {
		// See Link.jsx in react-server/core/Link
		if (!e.metaKey) {
			e.preventDefault();
			e.stopPropagation();
			navigateTo(a.getAttribute('href'), {
				reuseDom: true,
			});
		} else {
			// do normal browser navigate
		}
	}
}

function addTargetBlank(a) {
	a.setAttribute('target', '_blank');
}
