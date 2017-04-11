import {Suite}              from "benchmark";
import Navigator            from "../context/Navigator.js";
import ExpressServerRequest from "../ExpressServerRequest.js";
import RequestLocalStorage  from "../util/RequestLocalStorage.js";

class Middleware {
	handleRoute        (next){return next()};
	getHeaders         (next){return next()};
	getTitle           (next){return next()};
	getScripts         (next){return next()};
	getHeadStylesheets (next){return next()};
	getMetaTags        (next){return next()};
	getLinkTags        (next){return next()};
	getBase            (next){return next()};
	getBodyClasses     (next){return next()};
	getElements        (next){return next()};
}

function run (n) {
	const m         = new Array(n).join(".").split(".").map(() => Middleware);
	const navigator = new Navigator({}, {routes: {}});
	const request   = new ExpressServerRequest({ query: {} })

	class Page extends Middleware { static middleware() {return m} }

	return function (deferred) {
		navigator.once('navigateDone', function() { deferred.resolve() });
		RequestLocalStorage.startRequest(() => {
			navigator.handlePage(Page, request, "pageload");
		});
	}
}

new Suite()
	.add("1",    run(   1), { defer: true })
	.add("10",   run(  10), { defer: true })
	.add("100",  run( 100), { defer: true })
	.add("1000", run(1000), { defer: true })
	.on('cycle', (v) => console.log(v.target.name + "\t" + v.target.stats.mean))
	.run()
