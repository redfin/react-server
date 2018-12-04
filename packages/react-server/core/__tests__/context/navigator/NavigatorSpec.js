import Navigator from "../../../context/Navigator";
import History from "../../../components/History";
import ExpressServerRequest from "../../../ExpressServerRequest";
import NavigatorRoutes from "./NavigatorRoutes";
import RequestLocalStorage from "../../../util/RequestLocalStorage";

class RequestContextStub {
	constructor(options) {
		this.navigator = new Navigator(this, options);
	}
	navigate (request, type) {
		RequestLocalStorage.startRequest(() => {
			this.navigator.navigate(request, type);
		});
	}
	getDeviceType() { return null; }
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

	it("routes to a page using a method GET (caps)", (done) => {
		const req = {
			method: "get",
			protocol: "http",
			secure: false,
			hostname: "localhost",
			url: "/getPageCaps",
		};
		const expressRequest = new ExpressServerRequest(req);

		const navigatedToPage = () => {
			expect(expressRequest.getRouteName()).toBe('GetPageCaps');
			done();
		};
		requestContext.navigator.on('navigateDone', navigatedToPage);
		requestContext.navigator.on('page', navigatedToPage);

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

		const navigatedToPage = () => {
			expect(expressRequest.getRouteName()).toBe('GetAndPostPage');
			done();
		};
		requestContext.navigator.on('navigateDone', navigatedToPage);
		requestContext.navigator.on('page', navigatedToPage);

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

		const navigatedToPage = () => {
			expect(expressRequest.getRouteName()).toBe('GetAndPostPage');
			done();
		};
		requestContext.navigator.on('navigateDone', navigatedToPage);
		requestContext.navigator.on('page', navigatedToPage);

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

			if (testingMethod === otherMethod) {
				it(`does route to a page expecting ${otherMethod} using a method ${testingMethod}`, (done) => {
					const navigatedToPage = (err) => {
						const httpStatus = err.status || 200;
						expect(httpStatus).toBe(200, `A route with method ${testingMethod} was not found when one should have been found.`);
						done();
					};
					requestContext.navigator.on('navigateDone', navigatedToPage);
					requestContext.navigator.on('page', navigatedToPage);
					requestContext.navigate(expressRequest, History.events.PAGELOAD);
				});

				it("routes to a page that accepts all methods", (done) => {
					const allMethodReq = {
						method: otherMethod,
						protocol: "http",
						secure: false,
						hostname: "localhost",
						url: "/allMethodsPage",
					};
					const allMethodExpressRequest = new ExpressServerRequest(allMethodReq);

					const navigatedToPage = (err) => {
						const httpStatus = err.status || 200;
						expect(httpStatus).toBe(200, `A route with method ${testingMethod} was not found for the AllMethodsPage.`);
						expect(allMethodExpressRequest.getRouteName()).toBe('AllMethodsPage');
						done();
					};
					requestContext.navigator.on('navigateDone', navigatedToPage);
					requestContext.navigator.on('page', navigatedToPage);

					requestContext.navigate(allMethodExpressRequest, History.events.PAGELOAD);
				});

				it("doesn't route to a page because the methods were set improperly with a 'null'", (done) => {
					const noMethodReq = {
						method: otherMethod,
						protocol: "http",
						secure: false,
						hostname: "localhost",
						url: "/nullMethodsPage",
					};
					const noMethodExpressRequest = new ExpressServerRequest(noMethodReq);

					const navigatedToPage = (err) => {
						const httpStatus = err.status || 200;
						expect(httpStatus).toBe(404, `A route with method ${testingMethod} was found for the NullMethodsPage.`);
						done();
					};
					requestContext.navigator.on('navigateDone', navigatedToPage);
					requestContext.navigator.on('page', navigatedToPage);

					requestContext.navigate(noMethodExpressRequest, History.events.PAGELOAD);
				});

				it("doesn't route to a page because the methods were set improperly with a '[]'", (done) => {
					const noMethodReq = {
						method: otherMethod,
						protocol: "http",
						secure: false,
						hostname: "localhost",
						url: "/emptyArrayMethodsPage",
					};
					const noMethodExpressRequest = new ExpressServerRequest(noMethodReq);

					const navigatedToPage = (err) => {
						const httpStatus = err.status || 200;
						expect(httpStatus).toBe(404, `A route with method ${testingMethod} was found for the EmptyArrayMethodsPage.`);
						done();
					};
					requestContext.navigator.on('navigateDone', navigatedToPage);
					requestContext.navigator.on('page', navigatedToPage);

					requestContext.navigate(noMethodExpressRequest, History.events.PAGELOAD);
				});
			} else {
				it(`doesn't route to a page expecting ${otherMethod} using a method ${testingMethod}`, (done) => {
					const navigatedToPage = (err) => {
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
