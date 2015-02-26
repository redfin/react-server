var Q = require("q"),
	Stores = require("../../data/Stores");

describe("A Triton data store", () => {
	

	it("only adds a promise's value to the state once it's resolved", (done) => {
		var store = Stores.createStoreFactory({})();

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
		var store = Stores.createStoreFactory({})();

		store.listen(() => fail("Change event fired when promise was added."));

		var deferred = Q.defer();
		store.setState({foo: deferred.promise});
	});

	it("does fire change when a promise resolves", (done) => {
		var store = Stores.createStoreFactory({})();

		store.listen(() => done());

		var deferred = Q.defer();
		store.setState({foo: deferred.promise});

		deferred.resolve("bar");
	});

});