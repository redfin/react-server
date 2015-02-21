var Q = require("q"),
	React = require("react"),
	TritonData = require("../../data/TritonData"),
	jsdom = require("jsdom");

// this is a crazy monkeypatch to convince React that it should use the DOM
require('react/lib/ExecutionEnvironment').canUseDOM = true;

var SimpleComponent = React.createClass({
	render: function() {
		return <div>{this.props.foo}</div>;
	}
});

var itWithDiv = (desc, testCallback) => {
	it(desc, (done) => {
		jsdom.env("<html><head></head><body><div id='main'></div</body></html>", (errors, window) => {
			var div = window.document.querySelector("#main");
			global.window = window;
			global.document = window.document;

			testCallback(div, () => {
				delete global.window;
				delete global.document;
				done();
			});
		});

	});
};

describe("A root element", () => {
	
	var store, storeClass, deferred1;

	beforeEach(() => {
		storeClass = TritonData.createStoreFactory({});
		store = new storeClass();
		deferred1 = Q.defer();
	});

	itWithDiv("changes its rendering when the store changes", (div, done) => {
		store.setState({foo:"bar"});

		React.render(TritonData.createRootElement(store, <SimpleComponent/>), div, () => {
			expect(div.innerHTML).toMatch("bar");
			store.setState({foo:"baz"});
			expect(div.innerHTML).toMatch("baz");
			done();
		});
	});

	itWithDiv("changes its rendering in a function when the store changes", (div, done) => {
		store.setState({foo:"bar"});

		React.render(TritonData.createRootElement(store, (state) => {
			return <SimpleComponent foo={state.foo + state.foo}/>
		}), div, () => {
			expect(div.innerHTML).toMatch("barbar");
			store.setState({foo:"baz"});
			expect(div.innerHTML).toMatch("bazbaz");
			done();
		});
	});

	itWithDiv("returns an early promise of an element with createRootElementWhen", (div, done) => {
		store.setState({foo:deferred1.promise});

		var shouldResolve = false;
		var elementPromise = TritonData.createRootElementWhen(["foo", "baz"], store, <SimpleComponent/>);

		elementPromise.then((element) => {
			expect(shouldResolve).toBe(true);
			React.render(element, div, () => {
				expect(div.innerHTML).toMatch("bar");
				done();
			});
		});

		// first test the early promise rendering.
		React.render(elementPromise.getValue(), div, () => {
			expect(div.innerHTML).toMatch(/<div.*data-reactid=.*><\/div>/);
			expect(div.innerHTML).not.toMatch("bar");
		});

		// now make the promise fire.
		setTimeout(() => {
			store.setState({baz:"qux"});
			setTimeout(() => {
				shouldResolve = true;
				deferred1.resolve("bar");
			})
		}, 100);
	});

	itWithDiv("returns an early promise of an element with createRootElementWhenResolved", (div, done) => {
		store.setState({foo:deferred1.promise});

		var shouldResolve = false;
		var elementPromise = TritonData.createRootElementWhenResolved(store, <SimpleComponent/>);

		elementPromise.then((element) => {
			expect(shouldResolve).toBe(true);
			React.render(element, div, () => {
				expect(div.innerHTML).toMatch("bar");
				done();
			});
		});

		// first test the early promise rendering.
		React.render(elementPromise.getValue(), div, () => {
			expect(div.innerHTML).toMatch(/<div.*data-reactid=.*><\/div>/);
			expect(div.innerHTML).not.toMatch("bar");
		});

		// now make the promise fire.
		setTimeout(() => {
			shouldResolve = true;
			deferred1.resolve("bar");
		}, 100);
	});

});