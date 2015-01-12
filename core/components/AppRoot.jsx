
var React = require('react/addons'),
	RouterMixin = require('./RouterMixin'),
	debug = require('debug')('AppRoot');


var AppRoot = React.createClass({
	mixins: [RouterMixin],

	displayName: "AppRoot",

	getInitialState: function () {
		this.navigator = this.props.context.navigator;
		var state = this.navigator.getState();
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
		this.setState(newState);
	},

	render: function () {
		// TODO: take out context and replace with continuation-local-storage -sra.
		var child = React.addons.cloneWithProps(this.props.childComponent, { context: this.props.context });
		if (this.props.childComponent) {
			return (
				<div>
					{ child }
					{ this.state.loading ? <div className="loading">LOADING</div> : "" }
				</div>
			);
		} else {
			return <div>Loading From AppRoot.jsx</div>;
		}
	}
});

module.exports = AppRoot;