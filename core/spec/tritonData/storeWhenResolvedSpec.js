var Q = require("q"),
	TritonData = require("../../data/TritonData");

describe("A Triton data store", () => {

	var store, child, storeClass, deferred1, deferred2;

	beforeEach(() => {
		storeClass = TritonData.createStoreFactory({});
		store = new storeClass();
		child = new storeClass();
		deferred1 = Q.defer();
		deferred2 = Q.defer();
	});

	it("resolves 'whenResolved' immediately when there are no pending values", (done) => {
		store.whenResolved().then((state) => {
			expect(state).toEqual({});
			done();
		});
	});

	it("sends the state to the 'whenResolved' promise", (done) => {
		store.setState({foo:"bar"});
		store.whenResolved().then((state) => {
			expect(state).toEqual({foo:"bar"});
			done();
		});
	});

	it("resolves 'whenResolved' after a single promised value is resolved", (done) => {
		var whenResolvedShouldFire = false;
		var deferred1 = Q.defer();

		store.setState({foo: deferred1.promise});

		store.whenResolved().then((state) => {
			if (!whenResolvedShouldFire) fail("Fired whenResolved too early");
			expect(state).toEqual({foo:"bar"});
			done(); 
		});

		// use set timeout so that the promise has a chance to fire mistakenly.
		setTimeout(() => {
			whenResolvedShouldFire = true;
			deferred1.resolve("bar");
		}, 100);

	});

	it("resolves 'whenResolved' only after all promised values resolve", (done) => {
		var whenResolvedShouldFire = false;

		store.setState({foo: deferred1.promise});
		store.setState({baz: deferred2.promise});

		store.whenResolved().then((state) => {
			if (!whenResolvedShouldFire) fail("Fired whenResolved too early");
			expect(state).toEqual({foo:"bar", baz:"qux"});
			done(); 
		});

		setTimeout(() => {
			deferred1.resolve("bar");
			setTimeout(() => {
				whenResolvedShouldFire = true;
				deferred2.resolve("qux");
			}, 100);
		}, 100);
	});

	it("resolves 'whenResolved' only after all promised values resolve, even those that don't exist when 'whenResolved' is called", (done) => {
		var whenResolvedShouldFire = false;

		store.setState({foo: deferred1.promise});

		store.whenResolved().then((state) => {
			if (!whenResolvedShouldFire) fail("Fired whenResolved too early");
			expect(state).toEqual({foo:"bar", baz:"qux"});
			done(); 
		});

		deferred1.promise.then(() => store.setState({baz: deferred2.promise}));

		setTimeout(() => {
			deferred1.resolve("bar");
			setTimeout(() => {
				whenResolvedShouldFire = true;
				deferred2.resolve("qux");
			}, 100);
		}, 100);

	});
});