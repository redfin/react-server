import _ from "lodash";
import React from "react";
import {
	Link,
	RootContainer,
} from "react-server";

import {
	GET,
	ROWS,
	PagePointer,
	RowIndex,
	RowMS,
	ClientRenderIndicator,
} from "./common";

require('./common.css');
require('./playground.css');

const BASE = "/navigation/playground";
const LINK = (page, pick) => `${BASE}?${
	_.map({page,pick},(v,k)=>v!==void 0?k+'='+v:'').filter(v=>v).join('&')
}`

// For simplicity of 'pick' link management.
// Add a 'pushstate' method.
;(function() {
	if (typeof window === 'undefined') return;
	const pushState = history.pushState;
	history.pushState = function(state){
		window.dispatchEvent(_.assign(new Event('pushstate'), {state}));
		return pushState.apply(this, arguments);
	}
})();

// This thing uses non-`react-server` history API manipulation.
class PickPointer extends React.Component {
	constructor(props) {
		super(props);
		this._init(props);
	}
	componentDidMount() {
		this._listen = ({state}) => {
			const {pick} = state||{};

			// For the purposes of our test we don't want to
			// "reset" to nothing picked unless the history nave
			// frame is _ours_ (it has a "state" property).
			if (typeof pick === 'undefined') return;

			this.setState({pick});
		}
		window.addEventListener('pushstate', this._listen);
		window.addEventListener('popstate',  this._listen);
	}
	componentWillUnmount() {
		window.removeEventListener('pushstate', this._listen);
		window.removeEventListener('popstate',  this._listen);
	}
	componentWillReceiveProps(props){
		this._init(props);
	}
	_init(props) {
		// Yep.  State from props.  :japanese_ogre:
		this.state = _.pick(props, ['pick', 'row', 'page']);
	}
	_pick() {
		const {page, row} = this.state;
		history.pushState({pick: row}, null, LINK(page, row));
	}
	render() {
		const {pick, row} = this.state;
		return <div onClick={this._pick.bind(this)} className="pick-pointer">
			{+pick === +row ? "★" : "☆"}
		</div>;

	}
}

const NL       = ({row}) => <a href={LINK(row)}>Normal Link</a>
const CT       = ({row}) => <Link path={LINK(row)}>CT</Link>
const RD       = ({row}) => <Link reuseDom={true} path={LINK(row)}>CT/RD</Link>
const BD       = ({row}) => <Link bundleData={true} path={LINK(row)}>CT/BD</Link>
const BDRD     = ({row}) => <Link bundleData={true} reuseDom={true} path={LINK(row)}>CT/BD/RD</Link>

export default class NavigationPlaygroundPage {
	handleRoute(next) {
		const {page, pick} = this.getRequest().getQuery();
		this.data = ROWS.map(GET.bind({page, pick}));

		return next();
	}
	getTitle() {
		const {page} = this.getRequest().getQuery();
		return typeof page === "undefined"
			?"Navigation Playground"
			:"Page "+page
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
				</ul>
			</RootContainer>,
			...this.data.map(promise => <RootContainer when={promise} className="row">
				<PagePointer />
				<PickPointer />
				<RowIndex />
				<RowMS />
				<ClientRenderIndicator />
				<NL />
				<CT />
				<RD />
				<BD />
				<BDRD />
			</RootContainer>),
		]
	}
}
