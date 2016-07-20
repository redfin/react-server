import {Component} from 'react';
import ReactMarkdown from 'react-markdown';

export default class DocBody extends Component {
	render() {
		return <ReactMarkdown source={ this.props.text } />
	}
}
