var Store = require("../../data/Store");

describe("A store with a child store", () => {

	var parent, child;

	beforeEach(() => {
		parent = new Store();
		child = new Store();

		child.setState({foo:"bar"});
		parent.setState({child:child});
	});

	it("sets the child store's state as a state property, not the child store itself", () => {
		expect(parent.state.child).not.toBe(child);
		expect(parent.state.child.foo).toBe("bar");

	});

	it("listens to the child store for a single state changes", (done) => {
		parent.on("change", () => {
			expect(parent.state.child.baz).toBe("qux");
			done();
		});

		child.setState({baz:"qux"});
	});

	it("listens to the child store for a multi state changes", (done) => {
		parent.on("change", () => {
			expect(parent.state.child.baz).toBe("qux");
			expect(parent.state.child.foo).toBe("llama");
			done();
		});

		child.setState({baz:"qux", foo:"llama"});
	});

	it("stops listening to the child store when the child store is removed", (done) => {
		parent.setState({child: 3});

		parent.on("change", () => {
			fail("A change event fired for the parent.");
		});

		child.setState({dog: "cat"});

		setTimeout(done, 500);
	});

});