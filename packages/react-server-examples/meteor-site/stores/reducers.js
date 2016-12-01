import { assign } from "lodash";

import {
	SELECT_METEOR,
	SORT_METEORS,
	REQUEST_METEORITES,
	RECEIVE_METEORITES,
	INVALIDATE_METEORITES,
} from './actions'

const sortFunc = (a, b) => {
	if (a < b) return -1;
	if (a > b) return 1;

	return 0;
}

const meteor = (state = {}, action) => {
	switch (action.type) {
		case SELECT_METEOR:
			return assign({}, state, {
				selected: state.id === action.id,
			})
		default:
			return state;
	}
}

const meteors = (state = {
	isFetching: false,
	didInvalidate: false,
	meteors: [],
}, action) => {
	switch (action.type) {
		case INVALIDATE_METEORITES:
			return assign({}, state, {
				didInvalidate: true,
			});
		case REQUEST_METEORITES:
			return assign({}, state, {
				isFetching: true,
				didInvalidate: false,
			});
		case RECEIVE_METEORITES:
			return assign({}, state, {
				isFetching: false,
				didInvalidate: false,
				meteors: action.meteors,
				lastUpdated: action.receivedAt,
			});
		case SELECT_METEOR:
			if (state.meteors) {
				return assign({}, state, {
					meteors: state.meteors.map(t => meteor(t, action)),
				});
			}
		case SORT_METEORS:
			if (state.meteors) {
				switch (action.id) {
					case "mass":
						return assign({}, state, {
							meteors: state.meteors.slice(0).sort((a, b) => sortFunc(a.mass, b.mass)),
						});
					case "year":
						return assign({}, state, {
							meteors: state.meteors.slice(0).sort((a, b) => sortFunc(a.year.substring(0, 4), b.year.substring(0, 4))),
						});
					case "name":
					default:
						return assign({}, state, {
							meteors: state.meteors.slice(0).sort((a, b) => sortFunc(a.name.toLowerCase(), b.name.toLowerCase())),
						});
				}
			}
		default:
			return state;
	}
}

export default meteors;
