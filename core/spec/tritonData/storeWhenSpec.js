var Q = require("q"),
	TritonData = require("../../data/TritonData");

describe("A Triton data store", () => {

	var store, child, storeClass;

	beforeEach(() => {
		storeClass = TritonData.createStoreFactory({});
		store = new storeClass();
		child = new storeClass();
	});

	it("fires when when a simple value is added", (done) => {
		store.when("foo").then((state) => {
			expect(state.foo).toBe("bar");
			expect(store.state.foo).toBe("bar");
			done();
		});

		store.setState({foo: "bar"});
	});

	it("fires when when a simple value is already present", (done) => {
		store.setState({foo: "bar"});

		store.when("foo").then((state) => {
			expect(state.foo).toBe("bar");
			expect(store.state.foo).toBe("bar");
			done();
		});
	});

	it("fires when when multiple values added", (done) => {
		store.when(["foo", "baz"]).then((state) => {
			expect(state.foo).toBe("bar");
			expect(store.state.foo).toBe("bar");
			expect(state.baz).toBe("qux");
			expect(store.state.baz).toBe("qux");
			done();
		});

		store.setState({foo: "bar", baz: "qux"});
	});

	it("fires when when multiple values already present", (done) => {
		store.setState({foo: "bar", baz: "qux"});

		store.when(["foo", "baz"]).then((state) => {
			expect(state.foo).toBe("bar");
			expect(store.state.foo).toBe("bar");
			expect(state.baz).toBe("qux");
			expect(store.state.baz).toBe("qux");
			done();
		});
	});

	it("only fires when when the last of a list of multiple values is added", (done) => {
		var allValuesAdded = false;
		store.when(["foo", "baz"]).then((state) => {
			expect(allValuesAdded).toBe(true);
			expect(state.foo).toBe("bar");
			expect(store.state.foo).toBe("bar");
			expect(state.baz).toBe("qux");
			expect(store.state.baz).toBe("qux");
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

		store.setState({foo: deferred.promise});

		store.when("foo").then((state) => {
			expect(state.foo).toBe("bar");
			expect(store.state.foo).toBe("bar");
			done();
		});

		deferred.resolve("bar");
	});

	it("doesn't fire when when a promised value doesn't resolve", (done) => {
		var deferred = Q.defer();

		store.when("foo").then((state) => {
			fail("when should not fire");
		});

		store.setState({foo: deferred.promise});

		// call done() in a timeout so that there's a chance for the when to (incorrectly) fire
		setTimeout(done, 200);
	});
});