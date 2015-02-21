var Q = require("q"),
	Store = require("../../data/Store");

describe("A Triton data store", () => {
	

	it("only adds a promise's value to the state once it's resolved", (done) => {
		var store = new Store();

		var deferred = Q.defer();
		store.setState({foo: deferred.promise});

		expect(store.state.foo).not.toBeDefined();

		deferred.resolve("bar");

		setTimeout(() => {
			expect(store.state.foo).toBe("bar");
			done();
		}, 50);
	});

	it("doesn't fire change when a promise is added", () => {
		var store = new Store();

		store.on("change", () => fail("Change event fired when promise was added."));

		var deferred = Q.defer();
		store.setState({foo: deferred.promise});
	});

	it("does fire change when a promise resolves", (done) => {
		var store = new Store();

		store.on("change", () => done());

		var deferred = Q.defer();
		store.setState({foo: deferred.promise});

		deferred.resolve("bar");
	});

});