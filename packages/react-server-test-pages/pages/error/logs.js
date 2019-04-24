/* eslint-disable react/react-in-jsx-scope */
/* eslint "react/no-deprecated": "warn" */

import Q from 'q';
import { Component } from 'react';
import { RootElement } from 'react-server';

class RenderError extends Component { // eslint-disable-line react/require-render-return
	render() {
		throw new Error('Error in render');
	}
}

const ReceiveProps = OriginalComponent => class extends Component { // eslint-disable-line react/display-name
	constructor(props) {
		super(props);
		this.state = {
			randomProp: Math.random(),
		};
	}
	updateState() {
		this.setState({
			randomProp: Math.random(),
		});
	}
	render() {
		return (
			<h2>
				<button onClick={this.updateState.bind(this)}>
					Click to update props
				</button>
				<OriginalComponent {...this.state}/>
			</h2>
		);
	}
};

const ComponentWillReceivePropsError = ReceiveProps(
	class extends Component { // eslint-disable-line react/display-name
		componentWillReceiveProps() {
			throw Error('Error in componentWillReceiveProps');
		}
		render() {
			return <span>componentWillReceiveProps error</span>;
		}
	}
);

const ComponentDidReceivePropsError = ReceiveProps(
	class extends Component { // eslint-disable-line react/display-name
		componentDidReceiveProps() {
			throw Error('Error in componentDidReceiveProps');
		}
		render() {
			return <span>componentDidReceiveProps error</span>;
		}
	}
);

const ComponentWillUpdateError = ReceiveProps(
	class extends Component { // eslint-disable-line react/display-name
		componentWillUpdate() {
			throw Error('Error in componentWillUpdate');
		}
		render() {
			return <span>componentWillUpdate error</span>;
		}
	}
);

const ComponentDidUpdateError = ReceiveProps(
	class extends Component { // eslint-disable-line react/display-name
		componentDidUpdate() {
			throw Error('Error in componentDidUpdate');
		}
		render() {
			return <span>componentDidUpdate error</span>;
		}
	}
);

class ComponentDidMountError extends Component {
	componentDidMount() {
		throw Error('Error in componentDidMount');
	}
	render() {
		return <h2>componentDidMount Error</h2>;
	}
}

class ComponentWillMountError extends Component {
	componentWillMount() {
		throw Error('Error in componentWillMount');
	}
	render() {
		return <h2>componentWillMount Error</h2>;
	}
}

function fail() {
	return Q().then(() => { throw new Error('Fail'); });
}

const RootElementWhenPromiseFailure = (() =>
	<RootElement when={fail()}>
		<h2>RootElement when=failed promise</h2>
	</RootElement>
);

class MissingKeyPropInArrayIterator extends Component {
	render() {
		return (
			<div>
				<h2 key={0}>Missing Key Prop in Array Iterator Warning</h2>
				{ [1,2,3,4].map(n => <span key={n}>{n}</span>) }
			</div>
		);
	}
}

export default class ErrorReportingPage {
	getElements() {
		return [
			<h1 key={0}>Error Logging Tests</h1>,
			<h2 key={1}>Render error</h2>,
			<RenderError key={2}/>,
			<ComponentWillMountError key={3}/>,
			<ComponentDidMountError key={4}/>,
			<ComponentWillReceivePropsError key={5}/>,
			<ComponentDidReceivePropsError key={6}/>,
			<ComponentWillUpdateError key={7}/>,
			<ComponentDidUpdateError key={8}/>,
			<RootElementWhenPromiseFailure key={9}/>,
			<MissingKeyPropInArrayIterator key={10}/>,
		];
	}
}
