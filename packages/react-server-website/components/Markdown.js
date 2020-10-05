import PropTypes from 'prop-types';
import React from 'react';

import Remarkable from 'remarkable';
import hljs from '../lib/highlight.js';

import {logging, navigateTo} from 'react-server';

import './Markdown.less';

const logger = logging.getLogger(__LOGGER__);

export default class Markdown extends React.Component {
	render() {
		let content = this.props.children || this.props.source;

		return <div className="dangerous-markdown" dangerouslySetInnerHTML={{
			__html: this._renderMarkdown(content),
		}} />
	}

	_renderMarkdown(content) {
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
		// Our markdown documentation contains both internal and external links.
		// We want to make sure that external links open in a new tab, and that
		// internal links use client transitions for better performance.

		[].slice.call(document.querySelectorAll('.dangerous-markdown a')).forEach(a => {
			if (isInternal(a)) {
				addOnClickHandler(a, this.props);
			} else {
				addTargetBlank(a);
			}
		});
	}
}

Markdown.propTypes = {
	children   : PropTypes.node,
	source     : PropTypes.string,
	reuseDom   : PropTypes.bool,
	bundleData : PropTypes.bool,
};

Markdown.defaultProps = {
	reuseDom   : false,
	bundleData : true,
}

function isInternal(a) {
	const href = a.getAttribute('href');
	return href.startsWith('/');
}

function addOnClickHandler(a, {reuseDom, bundleData}) {
	a.onclick = function (e) {
		if (!e.metaKey) {
			e.preventDefault();
			e.stopPropagation();
			navigateTo(a.getAttribute('href'), {reuseDom, bundleData});
		} else {
		}
	}
}

function addTargetBlank(a) {
	a.setAttribute('target', '_blank');
}
