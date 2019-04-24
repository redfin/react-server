import { default as React } from "react";
import { RootElement, TheFold } from "react-server";
import Q from "q";
import { RootProvider, ReduxAdapter } from "react-server-redux";
import configureStore from "../stores";
import { Header, Footer, MeteorMap, MeteorTable } from "../components";
import { selectSort, fetchPostsIfNeeded } from "../stores/actions";

import "../styles/general.css";

export default class Homepage {
	handleRoute(next) {
		// Set up a fake promise for streaming out the footer
		const deferred = Q.defer();
		setTimeout(() => deferred.resolve(), 5000);
		this.promise = deferred.promise;

		// Figure out the sorting
		const request = this.getRequest();
		const params = request.getRouteParams();
		const sort = params.sort ? params.sort : "name";

		this.meteorStore = configureStore();
		this.storeAdapter = new ReduxAdapter(this.meteorStore);

		this.storePromise = this.meteorStore.dispatch(fetchPostsIfNeeded())
			.then(() => this.meteorStore.dispatch(selectSort(sort)));

		return this.storePromise.then(next());
	}

	getElements() {
		return [
			// A basic component
			<Header key={1}/>,
			// More complex container components using redux
			<RootProvider key={2} store={this.meteorStore}>
				<RootElement when={this.storeAdapter.when(['meteors'])}>
					<div className="row">
						<div className="col-md-6">
							<MeteorMap />
						</div>
						<div className="col-md-6">
							<MeteorTable />
						</div>
					</div>
				</RootElement>
			</RootProvider>,
			// Mark when we want our js/css to bind on the client side
			<TheFold key={3} />,
			// A delayed loaded component
			<RootElement key={4} when={this.promise}>
				<Footer />
			</RootElement>,
		];
	}

	getTitle() {
		return "Earth Meteorite Landings";
	}

	getBodyClasses() {
		return ["container"];
	}

	getMetaTags() {
		return [
			{charset: "utf8"},
			{"http-equiv": "x-ua-compatible", "content": "ie=edge"},
			{name: "viewport", content: "width=device-width, initial-scale=1"},
			{name: "description", content: "Meteorite app, powered by React Server"},
			{name: "generator", content: "React Server"},
		]
	}
}
