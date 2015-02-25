var Stores = require("../../data/Stores");

describe("A TritonData store", () => {
	it ("has the methods one would expect", () => {
		var TestStore = Stores.createStoreFactory({
			foo() {
				return "bar";
			}
		})
		var store = TestStore();
		expect(store.setState).toBeDefined();
		expect(store.foo).toBeDefined();
		expect(store.foo()).toBe("bar");
	});

	it("has a state object", () => {
		var store = Stores.createStoreFactory({})();
		expect(store.state).toBeDefined();		
	});

	it("has an init method that gets called", (done) => {
		var TestStore = Stores.createStoreFactory({
			init(arg) {
				expect(arg).toBe(2);
				done();
			}
		})
		var store = TestStore(2);
	});

	it("emits a change event when the state is changed", (done) => {
		var store = Stores.createStoreFactory({})();

		store.listen(() => {
			expect(store.state.foo).toBe("bar");
			done();
		});

		store.setState({foo: "bar"});
	});

});