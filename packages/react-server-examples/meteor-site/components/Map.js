import PropTypes from 'prop-types';
import React from "react";
import GoogleMap from "google-map-react";

const MeteorMap = ({ defaultCenter, center , meteors }) => (
	<div style={{height: "400px", width: "400px", overflow: "hidden"}}>
		<GoogleMap
			bootstrapURLKeys={{
				language: "en",
			}}
			defaultCenter={defaultCenter}
			defaultZoom={4}
			center={center}>
			{meteors.map(m => (
				<div
					key={m.id}
					lat={m.lat}
					lng={m.lng}
					text={m.name}
					className="meteor-icon"
				/>
			))}
		</GoogleMap>
	</div>
);

MeteorMap.propTypes = {
	defaultCenter: PropTypes.shape({
		lat: PropTypes.number,
		lng: PropTypes.number,
	}).isRequired,
	center: PropTypes.shape({
		lat: PropTypes.number,
		lng: PropTypes.number,
	}),
	meteors: PropTypes.arrayOf(PropTypes.shape({
		id: PropTypes.string.isRequired,
		name: PropTypes.string.isRequired,
		lat: PropTypes.number.isRequired,
		lng: PropTypes.number.isRequired,
	}).isRequired).isRequired,
	onMeteorClick: PropTypes.func.isRequired,
};

export default MeteorMap;
