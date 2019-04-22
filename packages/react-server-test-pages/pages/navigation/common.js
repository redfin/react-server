import _ from "lodash";
import {Component} from "react";
import PropTypes from "prop-types";
import {ReactServerAgent} from "react-server";

// Each row listens to `navigateStart'.
// Give ourselves some buffer.
require('events').EventEmitter.defaultMaxListeners = 128;

export const ROWS = _.range(32);

export function GET(row) {
	const ms  = row*16;
	const val = JSON.stringify({row, ms});
	return ReactServerAgent
		.get('/data/delay', {ms, val})
		.then(res => _.assign({}, this, res.body));
}

export class ClientRenderIndicator extends Component {
	constructor(props){
		super(props);
		this.state = {ready: false};
	}
	_handleNavEvent(evt) {
		if (!this._mounted) return;
		this.setState({ready: evt === 'loadComplete'});
	}
	componentDidMount() {
		this._mounted = true;
		this.setState({ready: true});
		const nav = window.__reactServerClientController.context.navigator;
		this._navListeners = ['navigateStart', 'loadComplete']
			.reduce((m,e) => (nav.on(e, m[e] = this._handleNavEvent.bind(this, e)), m), {});
	}
	componentWillUnmount() {
		this._mounted = false;
		const nav = window.__reactServerClientController.context.navigator;
		_.forEach(this._navListeners, (v,k) => nav.removeListener(k, v));
	}
	componentWillReceiveProps() {
		this.setState({ready: true});
	}
	render() {
		return <div className="render-indicator">
			{this.state.ready?"✓":"⌛️"}
		</div>
	}
}


export const PagePointer = ({page, row}) => <div className="page-pointer">
	{+page === +row ? "➟" : ""}
</div>;

PagePointer.propTypes = {
	page: PropTypes.number,
	row: PropTypes.number,
};

export const RowIndex = ({row}) => <div className="row-index">Row {row}</div>;
RowIndex.propTypes = {
	row: PropTypes.number,
};

export const RowMS = ({ms}) => <div className="row-ms">{ms}ms</div>;
RowMS.propTypes = {
	ms: PropTypes.number,
};
