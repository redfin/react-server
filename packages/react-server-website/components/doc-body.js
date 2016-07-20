import {Component} from 'react';
import Markdown from './Markdown';

export default class DocBody extends Component {
	render() {
		return <Markdown source={ this.props.text } />
	}
}
