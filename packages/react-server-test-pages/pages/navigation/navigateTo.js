/* eslint-disable react/react-in-jsx-scope */

import {navigateTo} from "react-server";
import PropTypes from "prop-types";

const go = page => navigateTo(
	`/navigation/navigateTo?cur=${page}`,
	{reuseDom: true}
)

const Nav = ({cur}) => <div onClick={() => go(cur+1)}>
	<div>Current page: {cur}</div>
	<div>Click for next page</div>
</div>

Nav.propTypes = {
	cur: PropTypes.number,
};

export default class NavigateToPage {
	getElements() {
		return <Nav cur={+this.getRequest().getQuery().cur||0} />
	}
}
