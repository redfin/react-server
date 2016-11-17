import { ReactServerAgent } from "react-server";

export const SELECT_METEOR = "SELECT_METEOR";
export const SORT_METEORS = "SORT_METEORS";
export const REQUEST_METEORITES = "REQUEST_METEORITES";
export const RECEIVE_METEORITES = "RECEIVE_METEORITES";
export const INVALIDATE_METEORITES = "INVALIDATE_METEORITES";

export const selectMeteor = (id) => ({
	type: SELECT_METEOR,
	id: id,
});

export const selectSort = (id) => ({
	type: SORT_METEORS,
	id: id,
});

const requestMeteors = () => ({
	type: REQUEST_METEORITES,
});

const receiveMeteors = (json) => ({
	type: RECEIVE_METEORITES,
	meteors: json,
	receivedAt: Date.now(),
});

const filteredData = (d) => (
	d.geolocation
	&& d.geolocation.coordinates
	&& d.id
	&& d.name
	&& d.mass
	&& d.year);

const fetchMeteors = () => {
	return (dispatch) => {
		dispatch(requestMeteors());

		return ReactServerAgent.get("https://data.nasa.gov/resource/y77d-th95.json")
			.then((response) => response.body)
			// Filter out any meteors we don't like
			.then((data) => data.filter(filteredData))
			// Since we cannot request a certain page, just only select the first 100
			.then((data) => data.slice(0, 100))
			.then((data) => dispatch(receiveMeteors(data)));
	}
}

const shouldFetchMeteors = (state) => {
	const posts = state.meteors;
	if (!posts || posts.length === 0) {
		return true;
	}
	else if (state.isFetching) {
		return false;
	}
	else {
		return state.didInvalidate;
	}
}

export const fetchPostsIfNeeded = () => {
	return (dispatch, getState) => {
		if (shouldFetchMeteors(getState())) {
			return dispatch(fetchMeteors())
		}

		return Promise.resolve(getState());
	}
}
