const text = `
(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
})(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

ga('create', 'UA-81160060-1', 'auto');
ga('send', 'pageview');
`.replace(/\s*\n\s*/g, '');

let alreadyListening = 0;

export default class AnalyticsMiddleware {

	handleRoute(next) {

		if (typeof window !== "undefined" && !alreadyListening++) {

			// Only need to do this once, since the client controller lives
			// across page views.
			window.__reactServerClientController.on("pageview", pageview => {
				window.ga('send', 'pageview', pageview);
			});
		}

		return next();
	}
	getScripts(next) {
		return next().concat({text});
	}
}
