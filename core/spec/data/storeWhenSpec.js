var Q = require("q"),
	Stores = require("../../data/Stores");

describe("A Triton data store", () => {

	var store, child, storeClass;

	beforeEach(() => {
		store = Stores.createStoreFactory({})();
		child = Stores.createStoreFactory({})();
	});

	it("fires when when a simple value is added", (done) => {
		store.when("foo").then((state) => {
			expect(state).toEqual(store.state);
			expect(state).toEqual({foo:"bar"});
			done();
		});

		store.setState({foo: "bar"});
	});

	it("fires when when a simple value is already present", (done) => {
		store.setState({foo: "bar"});

		store.when("foo").then((state) => {
			expect(state).toEqual(store.state);
			expect(state).toEqual({foo:"bar"});
			done();
		});
	});

	it("fires when when multiple values added", (done) => {
		store.when(["foo", "baz"]).then((state) => {
			expect(state).toEqual(store.state);
			expect(state).toEqual({foo:"bar", baz:"qux"});
			done();
		});

		store.setState({foo: "bar", baz: "qux"});
	});

	it("fires when when multiple values already present", (done) => {
		store.setState({foo: "bar", baz: "qux"});

		store.when(["foo", "baz"]).then((state) => {
			expect(state).toEqual(store.state);
			expect(state).toEqual({foo:"bar", baz:"qux"});
			done();
		});
	});

	it("only fires when when the last of a list of multiple values is added", (done) => {
		var allValuesAdded = false;
		store.when(["foo", "baz"]).then((state) => {
			expect(allValuesAdded).toBe(true);
			expect(state).toEqual(store.state);
			expect(state).toEqual({foo:"bar", baz:"qux"});
			done();
		});

		store.setState({foo: "bar"});
		setTimeout(() => {
			allValuesAdded = true;
			store.setState({baz: "qux"});
		}, 200);
	});

	it("fires when when a child store is added", (done) => {
		store.when("foo").then((state) => {
			expect(state.foo.baz).toBe("qux");
			expect(store.state.foo.baz).toBe("qux");
			done();
		});
		child.setState({baz: "qux"});
		store.setState({foo: child});
	});

	it("fires when when a child store is already present", (done) => {
		child.setState({baz: "qux"});
		store.setState({foo: child});

		store.when("foo").then((state) => {
			expect(state.foo.baz).toBe("qux");
			expect(store.state.foo.baz).toBe("qux");
			done();
		});
	});

	it("fires when when a promised value resolves", (done) => {
		var deferred = Q.defer();
		var shouldResolve = false;

		store.setState({foo: deferred.promise});

		store.when("foo").then((state) => {
			expect(shouldResolve).toBe(true);
			expect(state).toEqual(store.state);
			expect(state).toEqual({foo:"bar"});
			done();
		});

		setTimeout(() => {
			shouldResolve = true;
			deferred.resolve("bar");
		}, 100);
	});

	it("doesn't fire when when a promised value doesn't resolve", (done) => {
		var deferred = Q.defer();

		store.when("foo").then((state) => {
			fail("when should not fire");
		});

		store.setState({foo: deferred.promise});

		// call done() in a timeout so that there's a chance for the when to (incorrectly) fire
		setTimeout(done, 100);
	});
});