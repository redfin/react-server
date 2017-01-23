module.exports = class ReduxAdapter {
	constructor(store) {
		this.stateWaitMap = {};
		this.store = store;
	}

	//Search the state for the values we are waiting on
	//State is considered ready when the waiting value is neither
	//undefined or null
	checkStateStatus() {
		const state = this.store.getState();
		Object.keys(this.stateWaitMap).forEach((stateKey) => {
			if (!this.stateWaitMap[stateKey].resolved) {
				const keys = stateKey.split('.');
				let searchState = state;
				let isSatisfied = true;

				for (let y = 0; y < keys.length; y++) {
					const key = keys[y];
					if (!searchState.hasOwnProperty(key) || searchState[key] == null) {
						//exit we arent ready yet :(
						isSatisfied = false;
						break;
					}

					searchState = searchState[key];
				}

				if (isSatisfied) {
					this.stateWaitMap[stateKey].resolved = true;
					this.stateWaitMap[stateKey].resolver(searchState);
				}
			}
		});
	}

	//This implementation will watch for state changes and resolve once the state values
	//are available
	when(stateProps) {
		const promises = stateProps.map((stateProp) => {
			let promise = this.stateWaitMap[stateProp];
			if (!promise) {
				promise = new Promise((resolve) => {
					this.stateWaitMap[stateProp] = {resolver: resolve, resolved: false};
				});
			}

			return promise;
		});

		//Check for state immediately once
		this.checkStateStatus();
		const unsub = this.store.subscribe(this.checkStateStatus.bind(this));

		return Promise.all(promises).then(() => {
			unsub();
			return this.store.getState()
		});
	}
}
