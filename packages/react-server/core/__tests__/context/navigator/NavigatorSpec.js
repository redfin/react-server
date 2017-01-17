import Navigator from "../../../context/Navigator";
import History from "../../../components/History";
import ExpressServerRequest from "../../../ExpressServerRequest";
import NavigatorRoutes from "./NavigatorRoutes";

class RequestContextStub {
	constructor(options) {
		this.navigator = new Navigator(this, options);
	}
	navigate (request, type) {
		this.navigator.navigate(request, type);
	}
	framebackControllerWillHandle() { return false; }
	getMobileDetect() { return null; }
}


describe("Navigator", () => {
	let requestContext;
	const options = {
		routes: NavigatorRoutes,
	};

	beforeEach(() => {
		requestContext = new RequestContextStub(options);
	});
	afterEach(() => {
		requestContext = null;
	});

	it("routes to a page using an unspecified method get", (done) => {
		const req = {
			method: "get",
			protocol: "http",
			secure: false,
			hostname: "localhost",
			url: "/getAndHeadPage",
		};
		const expressRequest = new ExpressServerRequest(req);

		requestContext.navigator.on('page', () => {
			expect(expressRequest.getRouteName() === 'GetAndHeadPage');
			done();
		});

		requestContext.navigate(expressRequest, History.events.PAGELOAD);
	});

	it("routes to a page using an unspecified method HEAD", (done) => {
		const req = {
			method: "head",
			protocol: "http",
			secure: false,
			hostname: "localhost",
			url: "/getAndHeadPage",
		};
		const expressRequest = new ExpressServerRequest(req);

		requestContext.navigator.on('page', () => {
			expect(expressRequest.getRouteName() === 'GetAndHeadPage');
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
			url: "/getPageCaps",
		};
		const expressRequest = new ExpressServerRequest(req);

		requestContext.navigator.on('page', () => {
			expect(expressRequest.getRouteName() === 'GetPageCaps');
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


	const methods = [
		'get',
		'head',
		'put',
		'patch',
		'post',
	];

	methods.forEach((testingMethod) => {
		methods.forEach((otherMethod) => {
			const req = {
				method: otherMethod,
				protocol: "http",
				secure: false,
				hostname: "localhost",
				url: `/${testingMethod}Page`,
			};
			const expressRequest = new ExpressServerRequest(req);

			let navigatedToPage;
			if (testingMethod === otherMethod) {
				it(`does route to a page expecting ${otherMethod} using a method ${testingMethod}`, (done) => {
					navigatedToPage = (err) => {
						const httpStatus = err.status || 200;
						expect(httpStatus).toBe(200, `A route with method ${testingMethod} was not found when one should have been found.`);
						done();
					};
					requestContext.navigator.on('navigateDone', navigatedToPage);
					requestContext.navigator.on('page', navigatedToPage);
					requestContext.navigate(expressRequest, History.events.PAGELOAD);
				});
			} else {
				it(`doesn't route to a page expecting ${otherMethod} using a method ${testingMethod}`, (done) => {
					navigatedToPage = (err) => {
						const httpStatus = err.status || 200;
						expect(httpStatus).toBe(404, `A route with method ${testingMethod} was found when one should not have been found.`);
						done();
					};
					requestContext.navigator.on('navigateDone', navigatedToPage);
					requestContext.navigator.on('page', navigatedToPage);
					requestContext.navigate(expressRequest, History.events.PAGELOAD);
				});
			}
		});

	});

});
