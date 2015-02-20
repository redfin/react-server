var TritonData = require("../../data/TritonData");

describe("A TritonData store", () => {
	it ("has the methods one would expect", () => {
		var storeClass = TritonData.createStoreFactory({
			foo: function() {
				return "bar";
			}
		});
		var store = new storeClass();
		expect(store.setState).toBeDefined();
		expect(store.foo).toBeDefined();
		expect(store.foo()).toBe("bar");
	});

	it("gets the init method called when constructed", (done) => {
		var storeClass = TritonData.createStoreFactory({
			init: function(arg1, arg2, arg3) {
				expect(arg1).toBe("foo");
				expect(arg2).toBe("bar");
				expect(arg3).toBe(2);
				done();
			}
		});

		var store = new storeClass("foo", "bar", 2);
	});

	it("has a state object", () => {
		var storeClass = TritonData.createStoreFactory({});
		var store = new storeClass();

		expect(store.state).toBeDefined();		
	});

	it("emits a change event when the state is changed", (done) => {
		var storeClass = TritonData.createStoreFactory({});
		var store = new storeClass();

		store.on("change", () => {
			expect(store.state.foo).toBe("bar");
			done();
		});

		store.setState({foo: "bar"});
	});

});