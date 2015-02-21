var Q = require("q"),
	TritonData = require("../../data/TritonData");

describe("A Triton data store", () => {
	

	it("only adds a promise's value to the state once it's resolved", (done) => {
		var storeClass = TritonData.createStoreFactory({});
		var store = new storeClass();

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
		var storeClass = TritonData.createStoreFactory({});
		var store = new storeClass();

		store.on("change", () => fail("Change event fired when promise was added."));

		var deferred = Q.defer();
		store.setState({foo: deferred.promise});
	});

	it("does fire change when a promise resolves", (done) => {
		var storeClass = TritonData.createStoreFactory({});
		var store = new storeClass();

		store.on("change", () => done());

		var deferred = Q.defer();
		store.setState({foo: deferred.promise});

		deferred.resolve("bar");
	});

});