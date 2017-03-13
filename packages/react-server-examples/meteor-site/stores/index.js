import { createStore, applyMiddleware, compose } from "redux";
import thunkMiddleware from "redux-thunk";
import reducers from "./reducers";

const composeEnhancers = typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const configureStore = (preloadedState) => {
	const store = createStore(
		reducers,
		preloadedState,
		composeEnhancers(applyMiddleware(thunkMiddleware))
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
