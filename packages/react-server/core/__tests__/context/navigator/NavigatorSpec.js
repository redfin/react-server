import RequestContext from "../../../context/RequestContext";
import History from "../../../components/History";
import ExpressServerRequest from "../../../ExpressServerRequest";
import NavigatorRoutes from "./NavigatorRoutes";

describe("Navigator", () => {
	let requestContext;
	const options = {
		routes: NavigatorRoutes,
	};

	beforeEach(() => {
		requestContext = new RequestContext(options);
	});
	afterEach(() => {
		requestContext = null;
	});

	it("routes to a basic page using an unspecified method get", (done) => {
		const req = {
			method: "get",
			protocol: "http",
			secure: false,
			hostname: "localhost",
			url: "/basicPage",
		};
		const expressRequest = new ExpressServerRequest(req);

		requestContext.navigator.on('page', () => {
			expect(expressRequest.getRouteName() === 'BasicPage');
			done();
		});

		requestContext.navigate(expressRequest, History.events.PAGELOAD);
	});


	it("routes to a page using a method GET (caps)", (done) => {
		const req = {
			method: "get",
			protocol: "http",
			secure: false,
			hostname: "localhost",
			url: "/basicPageCaps",
		};
		const expressRequest = new ExpressServerRequest(req);

		requestContext.navigator.on('page', () => {
			expect(expressRequest.getRouteName() === 'BasicPageCaps');
			done();
		});

		requestContext.navigate(expressRequest, History.events.PAGELOAD);
	});

	it("routes to a page using a method POST", (done) => {
		const req = {
			method: "post",
			protocol: "http",
			secure: false,
			hostname: "localhost",
			url: "/postPage",
		};
		const expressRequest = new ExpressServerRequest(req);

		requestContext.navigator.on('page', () => {
			expect(expressRequest.getRouteName() === 'PostPage');
			done();
		});

		requestContext.navigate(expressRequest, History.events.PAGELOAD);
	});


	it("routes to a page that can handle GET and POST using a method GET", (done) => {
		const req = {
			method: "get",
			protocol: "http",
			secure: false,
			hostname: "localhost",
			url: "/getAndPostPage",
		};
		const expressRequest = new ExpressServerRequest(req);

		requestContext.navigator.on('page', () => {
			expect(expressRequest.getRouteName() === 'GetAndPostPage');
			done();
		});

		requestContext.navigate(expressRequest, History.events.PAGELOAD);
	});

	it("routes to a page that can handle GET and POST using a method POST", (done) => {
		const req = {
			method: "post",
			protocol: "http",
			secure: false,
			hostname: "localhost",
			url: "/getAndPostPage",
		};
		const expressRequest = new ExpressServerRequest(req);

		requestContext.navigator.on('page', () => {
			expect(expressRequest.getRouteName() === 'GetAndPostPage');
			done();
		});

		requestContext.navigate(expressRequest, History.events.PAGELOAD);
	});
});
