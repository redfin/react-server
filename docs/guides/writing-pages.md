# What is a page?

A page is a javascript representation of [a hypertext document suitable for the
world wide web and a web browser](https://en.wikipedia.org/wiki/Web_page).
Pages should roughly match one-to-one to urls for a web site.  Pages have
lifecycle methods that are called on them by react-server, which produce the
html, either on the server or in the browser.  By convention, pages are written
as [classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes),
but at their core, pages are Javascript objects with keys named for page
lifecycle events, and which have corresponding functions that return elements,
rendered as React instances.

The simplest of pages only needs a `getElements` method

```javascript
export default class SimplePage {
	getElements () {
		return <h1>Hello react-server</h1>;
	}
}
```


# Understanding the page lifecycle

Page lifecycle methods are called in groups that can return asynchronously in
any order.  We render the head element first

First, we call the following methods together

- renderDebugComments
- renderTitle
- renderScripts
- renderStylesheets

Once `renderStylesheets` has completed, we call the following methods together

- renderMetaTags
- renderLinkTags
- renderBaseTag

All of which is then sent to the browser.  Next, we call the rest of the page
lifecycle is called in order

1. getBodyClasses
1. getBodyStartContent
1. getElements

Once we reach the above the fold content, we'll start sending javascript.

If you don't provide a page lifecycle method, we provide a "best-guess" default
value; for instance, you can omit the head methods altogether and get a
performant and featureful page.


# Examples

### Full page

A `react-server` page that serves a full webpage.

```js
import HttpStatus from 'http-status-codes';
import MobileEnabled from ('./middleware/MobileEnabled');
const ExampleComponent = require("./components/example-component");
const ExampleStore = require("./stores/example-store");
const exampleAction = require("./actions/example-action");

class ExamplePage {
	// See [writing middleware](/docs/writing-middleware) for how to write middleware
	static middleware() { return [MobileEnabled]; }

	handleRoute(next) {
		var params = this.getRequest().getQuery();
		this._exampleStore = new ExampleStore({
			id: +params.id
		});
		return next();
	}

	getTitle() {
		return "Example page"
	}

	getHeadStylesheets() {
		return [
			"/styles/example.css",
			"/styles/reset.css"
		]
	}

	getMetaTags() {
		var tags = [
			{ name: "example", content: "Demonstrate a full react-server page" },
		];
		return tags;
	}

	getLinkTags() {
		return [
			// prefetch analytics to improve performance
			{ rel: "prefetch", href: "//www.google-analytics.com" },
		];
	}

	getBodyClasses() {
		return ["responsive-page", "typography"];
	}

	getElements() {
		return (
			<RootElement when={this._store.whenResolved()}>
				<h1>Example Page</h1>
				<ExampleComponent handleOnClick={exampleAction} {...this._exampleStore} />
			</RootElement>
		);
	}
}
```

### Json endpoint

```js
// returns a promise for example data
const getExampleData = require("./helpers/get-example-data");

module.exports = class ExampleJsonPage {

	// see the example in [writing middleware](/docs/writing-middleware)
	static middleware() { return [JsonEndpoint] }

	handleRoute() {
		const id = this.getRequest().getRouteParams().id;
		this.data = getExampleData(id);
		return {code:200};
	}

	getResponseData() {
		return this.data;
	}
}
```

### Setting Config values

For instance, to make a page into a fragment by setting the `isFragment` config
value

```js
const exampleComponent = require("./components/example-component");
const exampleStore = require("./stores/example-store");

export default class ExampleFragmentPage {
	setConfigValues() { return { isFragment: true }; }

	handleRoute() {
		this._store = exampleStore({ id: this.getRequest().getRouteParams().id });
		return {code:200};
	}

	getTitle () {
		return "School Fragment";
	}

	getElements() {
		return (
			<RootElement when={this._store.whenResolved()}>
				<h1>My example fragment page</h1>
				<exampleComponent />
			</RootElement>
		);
	}
}

module.exports = ExamplePage;
```


# Find out more

Check the [page api](/docs/page-api.md) to learn more.  If you'd like to check the
code, the page lifecycle is declared in
[`renderMiddleware.js`](http://redfin.github.io/react-server/annotated-src/renderMiddleware).
