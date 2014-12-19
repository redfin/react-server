
module.exports = class Bouncer {

	constructor (data) {
		this.setBouncerData(data || {});
	}

	setBouncerData (bouncerData) {
		this._bouncerData = bouncerData;
	}

	isOn (feature) {
		return typeof( this.getVariant(feature) ) !== "undefined";
	}

	getVariant (feature) {
		try {
			var featureId = feature && feature.id ? feature.id : feature;
			return this._bouncerData[featureId];
		}
		catch(e) {
			console.error("Bouncer failed for feature ["+feature+"]", e);
		}
		return {}.x; // Return (guaranteed to be) undefined. Cannot use "return undefined" because "undefined" can technically be reassigned
	}

}
