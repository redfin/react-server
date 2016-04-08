/* eslint-disable no-unused-vars */
import _ from "lodash";
import React from "react";
import {
	Link,
	ReactServerAgent,
	RootContainer,
} from "react-server";

require('./playground.css');

const ROWS = _.range(32);
const BASE = "/navigation/playground";

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

const NormalLink = ({row}) => <a href={`${BASE}?page=${row}`}>Normal Link</a>

const ClientTransitionLink = ({row}) => <Link path={`${BASE}?page=${row}`}>Client Transition</Link>

const FramebackLink = ({row}) => <Link frameback={true} path={`${BASE}?page=${row}`}>Frameback</Link>

class ClientRenderIndicator extends React.Component {
	constructor(props){
		super(props);
		this.state = {emoji: "⌛️"};
	}
	componentDidMount() {
		this.setState({emoji: "✓"});
	}
	render() {
		return <div className="render-indicator">
			{this.state.emoji}
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
			<FramebackLink/>
		</RootContainer>);
	}
}
