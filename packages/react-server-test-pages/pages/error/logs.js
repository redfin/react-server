import Q from 'q';
import { Component } from 'react';
import { RootElement } from 'react-server';

class RenderError extends Component {
	render() {
		throw new Error('Error in render');
	}
}

const ReceiveProps = OriginalComponent => class extends Component {
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
	class extends Component {
		componentWillReceiveProps(nextProps) {
			throw Error('Error in componentWillReceiveProps');
		}
		render() {
			return <span>componentWillReceiveProps error</span>;
		}
	}
);

const ComponentDidReceivePropsError = ReceiveProps(
	class extends Component {
		componentDidReceiveProps(nextProps) {
			throw Error('Error in componentDidReceiveProps');
		}
		render() {
			return <span>componentDidReceiveProps error</span>;
		}
	}
);

const ComponentWillUpdateError = ReceiveProps(
	class extends Component {
		componentWillUpdate(nextProps, nextState) {
			throw Error('Error in componentWillUpdate');
		}
		render() {
			return <span>componentWillUpdate error</span>;
		}
	}
);

const ComponentDidUpdateError = ReceiveProps(
	class extends Component {
		componentDidUpdate(prevProps, prevState) {
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

const RootElementWhenPromiseFailure = (props =>
	<RootElement when={fail()}>
		<h2>RootElement when=failed promise</h2>
	</RootElement>
);

class MissingKeyPropInArrayIterator extends Component {
	render() {
		return (
			<div>
				<h2>Missing Key Prop in Array Iterator Warning</h2>
				{ [1,2,3,4].map(n => <span>{n}</span>) }
			</div>
		);
	}
}

export default class ErrorReportingPage {
	getElements() {
		return [
			<h1>Error Logging Tests</h1>,
			<h2>Render error</h2>,
			<RenderError/>,
			<ComponentWillMountError/>,
			<ComponentDidMountError/>,
			<ComponentWillReceivePropsError/>,
			<ComponentDidReceivePropsError/>,
			<ComponentWillUpdateError/>,
			<ComponentDidUpdateError/>,
			<RootElementWhenPromiseFailure/>,
			<MissingKeyPropInArrayIterator/>,
		];
	}
}
