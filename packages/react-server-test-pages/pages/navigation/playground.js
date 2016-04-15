/* eslint-disable no-unused-vars */
import _ from "lodash";
import React from "react";
import {
	Link,
	ReactServerAgent,
	RootContainer,
} from "react-server";

require('./playground.css');

// Each row listens to `navigateStart'.
// Give ourselves some buffer.
require('events').EventEmitter.defaultMaxListeners = 128;

const ROWS = _.range(32);
const BASE = "/navigation/playground";
const LINK = row => `${BASE}?page=${row}`

function GET(row) {
	const ms  = row*16;
	const val = JSON.stringify({row, ms});
	return ReactServerAgent
		.get('/data/delay', {ms, val})
		.then(res => _.assign({}, this, res.body));
}

const RowIndex = ({row}) => <div className="row-index">Row {row}</div>;

const RowMS = ({ms}) => <div className="row-ms">{ms}ms</div>;

const PagePointer = ({page, row}) => <div className="page-pointer">
	{+page === +row ? "➟" : ""}
</div>;

const NormalLink = ({row}) => <a href={LINK(row)}>Normal Link</a>

const ClientTransitionLink = ({row}) => <Link path={LINK(row)}>Client Transition</Link>

const ReuseDom = ({row}) => <Link reuseDom={true} path={LINK(row)}>Reuse DOM</Link>

const BundleData = ({row}) => <Link bundleData={true} path={LINK(row)}>Bundle Data</Link>

const BundleDataAndReuseDom = ({row}) => <Link bundleData={true} reuseDom={true} path={LINK(row)}>Bundle AND Reuse</Link>

class FramebackCell extends React.Component {
	constructor(props){
		super(props);
		this.state = {available: true};
	}
	componentDidMount() {
		if (window.__reactServerIsFrame) {
			this.setState({available: false});
		}
	}
	render() {
		return <span className={this.state.available?'available':'not-available'}>
			<Link path={LINK(this.props.row)} frameback={true} {...this.props.link}>{
				this.props.children
			}</Link>
		</span>
	}
}

const FramebackLink = props => <FramebackCell {...props}>Frameback</FramebackCell>

class ClientRenderIndicator extends React.Component {
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

export default class NavigationPlaygroundPage {
	handleRoute(next) {
		const {page} = this.getRequest().getQuery();
		this.data = ROWS.map(GET.bind({page}));

		return next();
	}
	getElements() {
		return this.data.map(promise => <RootContainer when={promise} className="row">
			<PagePointer />
			<RowIndex />
			<RowMS />
			<ClientRenderIndicator />
			<NormalLink />
			<ClientTransitionLink />
			<ReuseDom />
			<BundleData />
			<BundleDataAndReuseDom />
			<FramebackLink />
		</RootContainer>);
	}
}
