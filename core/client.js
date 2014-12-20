/**
 * client.js contains the bootstrap code for the
 * client-side.
 */

// TODO: is triggering enum loads here too late? it appears todelay render
// by 50-100ms after page load (current enum hack loads a giant enum file though.
// might be faster if we did something more clever... like fixing JSEnumController
// to send down a module)
// ALSO: putting this require() at the top of the file appears to be somewhat
// noticeably faster than putting it after the requires below. I guess one of them
// has an intense setup? 
var enumRequestStart = new Date().getTime();
var enumDfd = require('./enums').init();


var React = require('react'),
	debug = require('debug'),
	bootstrapDebug = debug('rf:client'),
	RequestContext = require('./context/RequestContext'),
	AppRoot = React.createFactory(require('./components/AppRoot')),
	Q = require('q'),
	cssHelper = require('./util/ClientCssHelper');

// TODO: turn this off in prod builds
debug.enable("*");

require('./SuperAgentExtender').useSquigglyJson();

// for dev tools
window.React = React;

module.exports = {
	
	initialize: function (initialComponent, routes) {
		
		var initialRenderDfd = Q.defer();

		var dehydratedConfig = window.RF && window.RF.Config;
		if (!dehydratedConfig) {
			throw new Error("RF.Config not specified!");
		}

		// rehydrate the 'env' object
		var config = require("./config");
		config.rehydrate(dehydratedConfig);

		// update the URL from which webpack jsonp-loads require.ensure scripts
		// (mostly for lazy-loading routes for client-side routing)
		// TODO: factor this out somewhere
		__webpack_public_path__ = config.imageServerUrl + '/r3sjs/';

		var dehydratedState = window.RF && window.RF.InitialContext;

		var context = new RequestContext.Builder().setRoutes(routes).create();

		context.rehydrate(dehydratedState);

		window.context = context;

		var previouslyRendered = false;

		context.onNavigate( (err, result) => {
			debug('Executing navigate action');
			
			if (err) {
				debug("There was an error:", err);
				console.error(err);
				return;
			}

			var routeName = context.navigator.getCurrentRoute().name;

			if (!previouslyRendered) {
				cssHelper.registerPageLoad(routeName);
			} else {
				var newTitle = result.pageObject.getTitle();
				if (newTitle && newTitle !== document.title) {
					document.title = newTitle;
				}
			}

			cssHelper.ensureCss(routeName, result.pageObject);

			var render = function () {

				var mountNode = document.getElementById('content');

				bootstrapDebug('React Rendering');
				React.render(AppRoot({
					childComponent: result.component,
					context: context,
					pageStore: result.pageObject.getPageStore()
				}), mountNode, function () {
					bootstrapDebug('React Rendered');
					initialRenderDfd.resolve();
				});

			}

			if (!previouslyRendered) {

				// ensure that enums are ready before we start running code
				enumDfd.done(function () {
					render();
					previouslyRendered = true;
				});
			} else {
				render();
			}


		});

		var location = window.location;
		var path = location.pathname + location.search;
		context.navigate({path: path});

		return initialRenderDfd.promise;
	}
};