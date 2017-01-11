const Q = require('q');

module.exports = class ReduxAdapter {
	constructor(store) {
		this.stateWaitMap = {};
		this.store = store;
	}

	//Search the state for the values we are waiting on
	//State Values are either undefined or need to be null
	//TODO: Create a special enum for this
	checkStateStatus() {
		const state = this.store.getState();
		const stateKeys = Object.keys(this.stateWaitMap);

		for (let i = 0; i < stateKeys.length; i++) {
			if (this.stateWaitMap[stateKeys[i]].promise.isPending()) {
				const keys = stateKeys[i].split('.');
				let searchState = state;
				let isSatisfied = true;

				for (let y = 0; y < keys.length; y++) {
					const key = keys[y];
					if (!searchState.hasOwnProperty(key) || searchState[key] == null) {
						//exit we arent there yet :(
						isSatisfied = false;
						break;
					}

					searchState = searchState[keys[y]];
				}

				if (isSatisfied) {
					this.stateWaitMap[stateKeys[i]].resolve(searchState);
				}
			}
		}
	}

	//This implementation will watch for state changes and resolve once the state values
	//are available
	when(stateProps) {
		let promises = stateProps.map((stateProp) => {
			if (!this.stateWaitMap.hasOwnProperty(stateProp)) {
				this.stateWaitMap[stateProp] = Q.defer();
			}

			return this.stateWaitMap[stateProp].promise;
		});

		//Check it immediately once
		this.checkStateStatus();
		const unsub = this.store.subscribe(this.checkStateStatus.bind(this));

		return Q.all(promises).then(() => {
			unsub();
			return this.store.getState()
		});
	}
}
