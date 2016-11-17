import { connect } from "react-redux";
import { selectMeteor } from "../stores/actions";
import Map from "./Map";
import { find } from "lodash";

const defaultCenter = {
	lat: 37.795288,
	lng: -122.403330,
};

// Help method to get the center if we supplied a meteorite or not
const getCenter = m => {
	if (m) {
		return {
			lat: m.geolocation.coordinates[1],
			lng: m.geolocation.coordinates[0],
		};
	}

	return defaultCenter;
}

const mapStateToProps = state => ({
	defaultCenter: defaultCenter,
	center: getCenter(find(state.meteors, m => m.selected)),
	meteors: state.meteors.map(m => {
		return {
			id: m.id,
			name: m.name,
			lat: m.geolocation.coordinates[1],
			lng: m.geolocation.coordinates[0],
		}
	}),
});

const mapDispatchToProps = dispatch => ({
	onMeteorClick: id => dispatch(selectMeteor(id)),
});

const MeteorMap = connect(
	mapStateToProps,
	mapDispatchToProps
)(Map);

export default MeteorMap;
