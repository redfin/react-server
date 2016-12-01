# Example: Earth Meteorite Landings

In this example, we will be creating an example web site using [NASA Earth Meteorite data](https://data.nasa.gov/resource/y77d-th95.json), [Redux](http://redux.js.org/docs), [google-map-react](https://github.com/istarkov/google-map-react), and [boostrap](http://getbootstrap.com/css).

To see this example in action, just run `npm install` in this directory and start it up (once you have `react-server` installed) via `react-server start` by browsing to [localhost:3000](http://localhost:3000).

This tutorial was created using node 6.9.1.

## Getting Started

We will need to get `react-server` installed on the command line as well as bootstrapping our site with the default packages required by react-server. To get `react-server`, run the following command:

```bash
npm install -g react-server-cli
```

Once you have `react-server` available, go ahead and create a directory to hold this example:

```bash
mkdir -p ~/code/js/meteor-site
cd ~/code/js/meteor-site
react-server init
```

`react-server init` will set up the basics of a react-server site by installing required dependencies and building a `routes.json` file for you. Before we move on to the next step, let's install some libraries that we will use later:

```bash
npm install --save q react-redux redux-thunk redux google-map-react lodash
```

The libraries we installed will help us manage promises (q), bind our components to stores (redux), build a google map component (google-map-react) and provide some language functions (lodash).

## Hello World

In order to see _something_ on our new site, let's add a basic page:

```bash
react-server add-page '/' Homepage
```

What this command will do is add a new folder, `pages`, that contains a new file called `Homepage.js`. This is going to be our entry point to the new application. In addition to that, the `routes.json` file will be updated to include our new page. Go ahead and check out the contents of `Homepage.js` and then boot up the server:

```bash
react-server start
```

If you browse to [localhost:3000](http://localhost:3000), you should see the content that was returned from the `getElements` method in `Homepage.js`. For fun, go ahead and disable javascript and you should see the same content! That's the power of react-server, the same components used on both the client side and the server side!

If you're curious about the `Homepage.js` structure, check out the [page api doc](https://github.com/redfin/react-server/blob/master/docs/page-api.md) to see what is available.

## Adding a Component
Now that we have a new page, we probably want to add in some extra components. For this section we're going to add a new header:

```bash
mkdir components
touch components/Header.js
```

components/Header.js:
```js
import { default as React } from "react";

const Header = () => (
	<div className="page-header">
		<h1>World Meteorite Impacts</h1>
	</div>
);

export default Header;
```

Once we save our new component, adding it to our `Homepage.js` is easy. First, import the new header at the top and then adjust the `getElements` method to return an _array_ like so:
```js
getElements() {
	return [
		<Header />,
	];
}
```
The reason we changed this to an array is that we are going to be adding more components later and we want to help react-server understand our page by breaking it up into major sections. Once you make those changes, go ahead and reboot react server and browse [localhost:3000](http://localhost:3000). You should be able to see the header (both js enabled and disabled!).

## Adding Middleware
Next up we're going to add in some cross cutting code that we want to run on every page: middleware. Middleware lets us use the same page api but apply it to all of our pages. For this example, we're going to add in [boostrap](http://getbootstrap.com/css) to help us with some basic styling.

```bash
mkdir components
touch components/Boostrap.js
```

middleware/Bootstrap.js:
```js
export default class Bootstrap {
	getHeadStylesheets() {
		return "https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css";
	}
}
```

And then we just need to inform react-server about our middleware by editing the `routes.json` file:

```json
  "middleware": [
    "middleware/Bootstrap.js"
  ],
```

When we restart the server, we should get a new network request that will pull in bootstrap css. We will be adding in some gridded components later, so before moving on, edit `Homepage.js` to include some body level classes by defining this life cycle method:

```js
	getBodyClasses() {
		return ["container"];
	}
```

## Adding Presentational Components
It's time to add in some more complex components. For this section we will be adding in two components: Map and a Table. Go ahead and create two files under `components` called Map and Table:

components/Table.js:
```js
import { default as React } from "react";

const headerColumns = [
	{ id: 0, name: "Name", link: "/" },
	{ id: 1, name: "Mass", "link": "/sort/mass" },
	{ id: 2, name: "Year", "link": "/sort/year" },
];
const Header = ({ onHeaderClick }) => (
	<thead>
		<tr>
			{headerColumns.map(h =>
				<th className="pointer" key={h.id} onClick={() => onHeaderClick(h.id)}>{h.name}</th>
			)}
		</tr>
	</thead>
);

const Row = ({ id, name, mass, year, selected, onRowClick }) => {
	const selectedClass = selected ? "info pointer" : "pointer";
	return (
		<tr onClick={() => onRowClick(id)} className={selectedClass}>
			<td>{name}</td><td>{mass}</td><td>{year}</td>
		</tr>
	);
};

const Table = ({ header, meteors, onRowClick, onHeaderClick }) => (
	<table className="table table-striped table-hover">
		<Header header={header} onHeaderClick={onHeaderClick} />
		<tbody>
			{meteors.map(meteor =>
				<Row
					key={meteor.id}
					onRowClick={onRowClick}
					{...meteor}
				/>
			)}
		</tbody>
	</table>
);

export default Table;
```

components/Map.js:
```js
import { default as React  } from "react";
import GoogleMap from "google-map-react";

const sf = {
	lat: 37.795288,
	lng: -122.403330,
};

const MeteorMap = ({ defaultCenter = sf, center = sf, meteors }) => (
	<div style={{height: "400px", position: "relative"}}>
		<GoogleMap
			bootstrapURLKeys={{
				language: "en",
			}}
			defaultCenter={defaultCenter}
			defaultZoom={10}
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

export default MeteorMap;
```

Once these two files are created, we can include them into our `Homepage.js`:
```js
import Map from "../components/Map";
import Table from "../components/Table";

// Page class declaration cut

getElements() {
	return [
		<Header />,
		<div className="row">
			<div className="col-md-6">
				<Map meteors={[]} />
			</div>
			<div className="col-md-6">
				<Table meteors={[]} />
			</div>
		</div>,
	];
}
```
If we reboot our server, we should see both of our components (but with no data). The one thing to note here is the difference between when we get the page with javascript enabled versus disabled. The map component is clearly only for when the page is loaded on the client. However, the table can (and should) be rendered on the server. Check out both versions of the page to see the difference.

## Delayed Components
In order to show the ability of react-server to send down part of the page when it's ready while waiting for more data, we're going to add a new component, [Footer.js](./components/Footer.js). However, instead of just appending it to the end of our elements array, we're going to introduce a promise that gets resolved after 5 seconds:

pages/Homepage.js:
```js
import Q from "q";
import { RootElement } from "react-server";

// Page class declaration cut

handleRoute() {
	// Set up a fake promise for streaming
	const deferred = Q.defer();
	setTimeout(() => deferred.resolve(), 5000);
	this.promise = deferred.promise;

	next();
}

getElements() {
	return [
		// Other components cut
		<RootElement key={0} when={this.promise}><Footer /></RootElement>,
	];
}
```

Again, reboot the server and check out the results. One thing you should notice is that the page takes a while to load. This is because we are waiting around for the timer to pop before we let the browser really paint anything. This is not ideal. Instead of restructuring how we built our component, we are going to introduce a new component, `TheFold`. `TheFold` informs react-server that if all the components above it are ready to go, do not wait for anything else to bind on the client side. Edit `Homepage.js` with the following and check out the results. You should see quite a difference in how the page _appears_ to load.

pages/Homepage.js
```js
import { TheFold } from "react-server";

// Page class declaration cut

getElements() {
	return [
		// Other components cut
		<TheFold />,
		<RootElement key={0} when={this.promise}><Footer /></RootElement>,
	];
}
```

## Adding Data
Since data can be complicated to set up, we are going to just copy in the required components and stores since this tutorial is not focusing on `redux`. First off, copy all the files inside of [stores](./stores) into your folder.  After you have those files, we need to add in two more files to bind this data to our presentational components. Copy over both the [MeteorMap.js](./components/MeteorMap.js) and [MeteorTable.js](./components/MeteorTable.js) into your components directory.

Once you have the stores and new components, next up we need to bind it into our `Homepage.js`:

pages/Homepage.js:
```js
import MeteorMap from "../components/MeteorMap";
import MeteorTable from "../components/MeteorTable";

import { Provider } from "react-redux";
import configureStore from "../stores";
import { selectSort, fetchPostsIfNeeded } from "../stores/actions";

// Page class declaration cut

handleRoute() {
	this.meteorStore = configureStore();
	this.storePromise = this.meteorStore.dispatch(fetchPostsIfNeeded());

	return this.storePromise.then(next());
}

getElements() {
	return [
		// Other components cut
		<RootElement key={1} when={this.storePromise}>
			<Provider store={this.meteorStore}>
				<div className="row">
					<div className="col-md-6">
						<MeteorMap />
					</div>
					<div className="col-md-6">
						<MeteorTable />
					</div>
				</div>
			</Provider>
		</RootElement>,
	];
}
```

What exactly is going on here? Well, what we've done is add in a new async redux store and informed react-server that we need it to wait for the data to load before we return the page. We do this by separating out the promise we got from the `dispatch` function and then pass that off to the return value for `handleRoute`. Once our dispatch promise resolves, it will invoke the `next()` method and let the page return. We also introduced the `Provider` component from `react-redux` to help us bind our stores to our presentational components.

This is only one example of how you can bind data to a page but it should give you an idea of the power of react-server when handling data using react.

## Transitions
Last but certainly not least, we are going to add in some transitions between different states of the page. Enabling transitions is pretty straight forward: we add in a new component, `Link`, to our table for when someone clicks on a header:

components/Table.js:
```js
import { Link } from "react-server";

// Code cut, this is in the Header component
<Link reuseDom={true} path={h.link}>{h.name}</Link>
```

And then edit our home page and routes.json to honor us routing to these new paths:

routes.json:
```json
"Homepage": {
  "path": ["/", "/sort/:sort"],
  "page": "pages/Homepage.js"
}
```

pages/Homepage.js:
```js

// Page class declaration cut

handleRoute() {
		// Delayed code cut

		// Figure out the sorting
		const request = this.getRequest();
		const params = request.getRouteParams();
		const sort = params.sort ? params.sort : "name";

		this.meteorStore = configureStore();
		this.storePromise = this.meteorStore.dispatch(fetchPostsIfNeeded())
			.then(() => this.meteorStore.dispatch(selectSort(sort)));
}
```

Once you restart the server with the changes applied above, you should be able to click on the header and transition to other sort pages like [http://localhost:3000/sort/mass](http://localhost:3000/sort/mass) or [http://localhost:3000/sort/year](http://localhost:3000/sort/year)! That's it!

## Wrap Up
That's it! Feel free to check out the code checked in here to see the full example. Otherwise, check out the [react-server docs](../../docs) for more information on what you can do with react-server.

## Notice
This tutorial uses icons made by [http://www.freepik.com](http://www.freepik.com) from [http://www.flaticon.com](Flaticon) licensed under CC 3.0.
