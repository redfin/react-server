import { createStore, applyMiddleware } from "redux";
import thunkMiddleware from "redux-thunk";
import reducers from "./reducers";

const configureStore = (preloadedState) => {
	const store = createStore(
		reducers,
		preloadedState,
		applyMiddleware(thunkMiddleware)
	);

	// https://github.com/reactjs/react-redux/releases/tag/v2.0.0
	if (module.hot) {
		// Enable Webpack hot module replacement for reducers
		module.hot.accept("./reducers", () => {
			const nextRootReducer = require("./reducers");
			store.replaceReducer(nextRootReducer);
		});
	}

	return store;
}

export default configureStore;
