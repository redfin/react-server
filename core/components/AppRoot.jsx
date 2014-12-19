
var React = require('react'),
	RouterMixin = require('./RouterMixin'),
	debug = require('debug')('AppRoot');


var AppRoot = React.createClass({
	mixins: [RouterMixin],

	displayName: "AppRoot",

	getInitialState: function () {
		this.navigator = this.props.context.navigator;
		var state = this.navigator.getState();
		state.componentFactory = React.createFactory(this.props.childComponent);
		return state;
	},

	// called when re-render is called from the top-level
	componentWillReceiveProps: function (nextProps) {
		if (this.props.pageStore && this.props.pageStore !== nextProps.pageStore) {
			// if the store has updated, disconnect events in the old store
			if (typeof this.props.pageStore.removeAllActionListeners === 'function') {
				this.props.pageStore.removeAllActionListeners();
			}
		}
		var newState = this.navigator.getState();
		newState.componentFactory = React.createFactory(nextProps.childComponent);
		this.setState(newState);
	},

	render: function () {
		if (this.state.componentFactory) {
			return (
				<div>
					{ this.state.componentFactory({ context: this.props.context, store: this.props.pageStore }) }
					{ this.state.loading ? <div className="loading">LOADING</div> : "" }
				</div>
			);
		} else {
			return <div>Loading From AppRoot.jsx</div>;
		}
	}
});

module.exports = AppRoot;