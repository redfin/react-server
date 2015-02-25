var Store = require("../../data/Store");

describe("A TritonData store", () => {
	it ("has the methods one would expect", () => {
		class TestStore extends Store {
			foo() {
				return "bar";
			}
		}
		var store = new TestStore();
		expect(store.setState).toBeDefined();
		expect(store.foo).toBeDefined();
		expect(store.foo()).toBe("bar");
	});

	it("has a state object", () => {
		var store = new Store();
		expect(store.state).toBeDefined();		
	});

	it("emits a change event when the state is changed", (done) => {
		var store = new Store();

		store.listen(() => {
			expect(store.state.foo).toBe("bar");
			done();
		});

		store.setState({foo: "bar"});
	});

});