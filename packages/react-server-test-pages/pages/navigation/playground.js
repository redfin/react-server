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

const NL       = ({row}) => <a href={LINK(row)}>Normal Link</a>
const CT       = ({row}) => <Link path={LINK(row)}>CT</Link>
const RD       = ({row}) => <Link reuseDom={true} path={LINK(row)}>CT/RD</Link>
const BD       = ({row}) => <Link bundleData={true} path={LINK(row)}>CT/BD</Link>
const BDRD     = ({row}) => <Link bundleData={true} reuseDom={true} path={LINK(row)}>CT/BD/RD</Link>
const FB       = (props) => <FBL {...props}></FBL>
const FBCT     = (props) => <FBL {...props} link={{reuseFrame:true}}>CT</FBL>
const FBCTBD   = (props) => <FBL {...props} link={{reuseFrame:true, bundleData:true}}>CT/BD</FBL>
const FBCTRD   = (props) => <FBL {...props} link={{reuseFrame:true, reuseDom:true}}>CT/RD</FBL>
const FBCTBDRD = (props) => <FBL {...props} link={{reuseFrame:true, bundleData:true, reuseDom:true}}>CT/BD/RD</FBL>

// Frameback Link.
class FBL extends React.Component {
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
		return <Link path={LINK(this.props.row)} frameback={true} {...this.props.link}>
			<span className={this.state.available?'available':'not-available'}>FB</span>{
				this.props.children?['/',...this.props.children]:[]
			}
		</Link>
	}
}


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
		return [
			<RootContainer>
				<h1>Navigation Playground</h1>
				<h2>Legend:</h2>
				<ul>
					<li>CT: Client Transition</li>
					<li>RD: Reuse DOM</li>
					<li>BD: Bundle Data</li>
					<li>FB: Frameback</li>
					<li><span className='not-available'>FB</span>: Frameback disabled (already in a frame)</li>
				</ul>
			</RootContainer>,
			...this.data.map(promise => <RootContainer when={promise} className="row">
				<PagePointer />
				<RowIndex />
				<RowMS />
				<ClientRenderIndicator />
				<NL />
				<CT />
				<RD />
				<BD />
				<BDRD />
				<FB />
				<FBCT />
				<FBCTBD />
				<FBCTRD />
				<FBCTBDRD />
			</RootContainer>),
		]
	}
}